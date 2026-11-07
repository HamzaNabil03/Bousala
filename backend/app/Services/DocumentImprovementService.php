<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Process\Process;
use ZipArchive;

class DocumentImprovementService
{
    public function extract(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        if ($extension === 'docx') {
            $zip = new ZipArchive;
            if ($zip->open($file->getRealPath()) !== true) {
                $this->invalid('ملف Word غير صالح.');
            }
            try {
                $entry = $zip->statName('word/document.xml');
                if (! $entry || $entry['size'] > 2_000_000) {
                    $this->invalid('ملف Word غير صالح أو أكبر من الحد المدعوم.');
                }
                $xml = $zip->getFromName('word/document.xml');
                if (! is_string($xml) || stripos($xml, '<!DOCTYPE') !== false || stripos($xml, '<!ENTITY') !== false) {
                    $this->invalid('ملف Word غير صالح.');
                }
                $dom = new DOMDocument;
                if (! @$dom->loadXML($xml, LIBXML_NONET)) {
                    $this->invalid('تعذّر قراءة ملف Word.');
                }
                $xpath = new DOMXPath($dom);
                $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
                $paragraphs = [];
                foreach ($xpath->query('//w:p') as $paragraph) {
                    $line = '';
                    foreach ($xpath->query('.//w:t | .//w:tab | .//w:br', $paragraph) as $node) {
                        $line .= $node->localName === 't' ? $node->textContent : ' ';
                    }
                    $paragraphs[] = $line;
                }
                $text = implode("\n", $paragraphs);
            } finally {
                $zip->close();
            }
        } else {
            $command = $extension === 'pdf'
                ? ['pdftotext', '-enc', 'UTF-8', $file->getRealPath(), '-']
                : ['antiword', '-m', 'UTF-8.txt', $file->getRealPath()];
            $process = new Process($command);
            $process->setTimeout(15);
            try {
                $size = 0;
                $process->run(function ($type, $buffer) use (&$size, $process): void {
                    $size += strlen($buffer);
                    if ($size > 2_000_000) {
                        $process->stop(0);
                    }
                });
                if (! $process->isSuccessful() || $size > 2_000_000) {
                    $this->invalid('تعذّر قراءة الملف. جرّب نسخة Word أو PDF نصي غير محمي بكلمة مرور.');
                }
                $text = $process->getOutput();
            } catch (\Symfony\Component\Process\Exception\ExceptionInterface $e) {
                $this->invalid('تعذّر قراءة الملف. جرّب نسخة Word أو PDF نصي غير محمي بكلمة مرور.');
            }
        }
        $text = trim($text);
        if (! mb_check_encoding($text, 'UTF-8') || mb_strlen($text) < 40) {
            $this->invalid('الملف لا يحتوي نصاً كافياً للقراءة. إن كان مسحاً ضوئياً، ارفع نسخة Word أو PDF نصي.');
        }
        if (mb_strlen($text) > 18000) {
            $this->invalid('الملف طويل جداً. الحد الأقصى 18000 حرف؛ ارفع السيرة أو الخطاب فقط.');
        }
        return $text;
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['file' => $message]);
    }

    public function docx(string $text): string
    {
        $path = tempnam(sys_get_temp_dir(), 'menhity-doc-');
        try {
            $zip = new ZipArchive;
            if ($zip->open($path, ZipArchive::OVERWRITE) !== true) {
                throw new \RuntimeException('Cannot create document');
            }
            $paragraphs = '';
            foreach (preg_split('/\R/u', $text) as $line) {
                $line = preg_replace('/[^\P{C}\t]/u', '', $line);
                $rtl = preg_match('/[\x{0600}-\x{06FF}]/u', $line) === 1;
                $properties = $rtl ? '<w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>' : '';
                $run = $rtl ? '<w:rPr><w:rtl/></w:rPr>' : '';
                $escaped = htmlspecialchars($line, ENT_XML1 | ENT_QUOTES, 'UTF-8');
                $paragraphs .= '<w:p>'.$properties.'<w:r>'.$run.'<w:t xml:space="preserve">'.$escaped.'</w:t></w:r></w:p>';
            }
            $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
            $zip->addFromString('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
            $zip->addFromString('word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'.$paragraphs.'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>');
            if (! $zip->close()) {
                throw new \RuntimeException('Cannot save document');
            }
            return $path;
        } catch (\Throwable $e) {
            @unlink($path);
            throw $e;
        }
    }
}

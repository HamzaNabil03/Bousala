# Document improvements

New `cv_improve` and `letter_improve` requests use `/tools/improve` and the authenticated `/api/v1/document-improvements` API. The team still handles `cv_build` and `letter_build`; existing manual improvement orders remain accessible. Legacy links redirect to the upload page.

Accepted inputs: text PDF, DOC and DOCX, up to 5 MiB / 18,000 extracted characters. Scanned or password-protected PDFs require a text/Word replacement. Output is a newly formatted DOCX in the source language, not a reconstruction of the original visual layout. Review AI suggestions before submitting an application.

Uses the existing configured AI provider without mock fallback. The student explicitly consents before extracted text is sent to that provider. Raw uploads are temporary and not persisted. Feedback and corrected text are stored privately in existing AI run records. Download endpoints enforce ownership; output is escaped when generating Word XML.

Deployment: Docker installs `poppler-utils` and `antiword`; PHP requires DOM/Zip. Migration enables only cv-enhancer and letter-enhancer. Existing provider configuration is reused. No new worker is required: processing is bounded by the provider timeout and a per-user concurrency lock. Reloading the page retrieves recent stored results. A client timeout does not automatically resubmit a document.

Validation: production frontend build/lint, Laravel feature suite, real PDF extraction, Arabic DOCX round-trip, private download authorization, missing provider/consent handling, invalid output rejection, manual order/payment regression checks, and existing container/CORS/concurrency CI.

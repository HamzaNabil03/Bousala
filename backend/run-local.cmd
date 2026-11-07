@echo off
set "PHPRC=%~dp0"
pushd "%~dp0public"
"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -S 0.0.0.0:8000 -t . "%~dp0vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php"
popd

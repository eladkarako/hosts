@echo off
chcp 65001 2>nul >nul


::--------------------------------------------------------------------------------------


::pre-cleanup (solves repeating-override problem).
set "EXIT_CODE=0"
set "NODE="
set "SCRIPT="
set "BUILD="


::--------------------------------------------------------------------------------------


::system-PATH 'node.exe'.
echo [INFO] looking for node.exe ...                                         1>&2
set "NODE=%~sdp0node.exe"
if exist %NODE%                                       ( goto LOCAL_NODE     )
for /f "tokens=*" %%a in ('where node.exe 2^>nul') do ( set "NODE=%%a"      )
if ["%ErrorLevel%"] NEQ ["0"]                         ( goto ERROR_NONODE   )
if ["%NODE%"] EQU [""]                                ( goto ERROR_NONODE   )
for /f %%a in ("%NODE%")                           do ( set "NODE=%%~fsa"   )
if not exist %NODE%                                   ( goto ERROR_NONODE   )
:LOCAL_NODE
echo [INFO] %NODE%                                                           1>&2
echo [INFO] Done.                                                            1>&2


::--------------------------------------------------------------------------------------


set "SCRIPT=_builder.js"
set "SCRIPT=%~sdp0%SCRIPT%"


::--------------------------------------------------------------------------------------


set "BUILD=build"
set "BUILD=%~sdp0%SCRIPT%"

del   /q /s /f "%BUILD%"               1>nul 2>nul
del   /q /s /f "%BUILD%\"              1>nul 2>nul
del   /q /s /f /a:rhisal "%BUILD%\*"   1>nul 2>nul
rmdir /q /s    "%BUILD%"               1>nul 2>nul
rmdir /q /s    "%BUILD%\"              1>nul 2>nul
if exist "%BUILD%"                     ( goto ERROR_CANTDELETEBUILD )
mkdir "%BUILD%"                        1>nul 2>nul
if exist "%BUILD%"                     ( goto ERROR_CANTCREATEBUILD )


::--------------------------------------------------------------------------------------


echo [INFO] ----------------------------- [PROGRAM OUTPUT START] 1>&2
echo "%NODE%" "%SCRIPT%" %*        1>&2
call "%NODE%" "%SCRIPT%" %*
set "EXIT_CODE=%ErrorLevel%"
echo [INFO] ----------------------------- [PROGRAM OUTPUT END]   1>&2

goto END


::--------------------------------------------------------------------------------------


:ERROR_NONODE
  set "EXIT_CODE=111"
  echo [ERROR] can not find node.exe (nither locally nor through PATH).    1>&2
  goto END

:ERROR_CANTDELETEBUILD
  set "EXIT_CODE=222"
  echo [ERROR] can not remove [%BUILD%\] folder. close down programs such as CMD that might use the folder, then try running this batch again.    1>&2
  goto END

:ERROR_CANTCREATEBUILD
  set "EXIT_CODE=333"
  echo [ERROR] can not create [%BUILD%\] folder. try running this batch again.    1>&2
  goto END

:END
  echo [INFO] Done. [EXIT_CODE: %EXIT_CODE%]. 1>&2
  pause                                       1>&2
  exit /b %EXIT_CODE%


::-----------------------------------
:: Exit-code
:: 0          success.
:: 111        missing node.exe
:: other      from node.exe
::-----------------------------------


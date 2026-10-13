Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c """ & scriptDir & "\launch-server.bat""", 0, False
WScript.Sleep 2500
WshShell.Run "cmd /c """ & scriptDir & "\launch-tunnel.bat""", 0, False

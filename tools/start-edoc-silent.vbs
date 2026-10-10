Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""d:\E-Doc for Dv\tools\launch-server.bat""", 0, False
WScript.Sleep 2500
WshShell.Run "cmd /c ""d:\E-Doc for Dv\tools\launch-tunnel.bat""", 0, False

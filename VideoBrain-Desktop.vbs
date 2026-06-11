Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
objShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & objShell.CurrentDirectory & "\VideoBrain-Desktop.ps1""", 0, False

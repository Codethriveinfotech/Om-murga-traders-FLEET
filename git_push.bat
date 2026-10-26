@echo off
cd /d "d:\priyanga\codethrive\FLEET-MANGEMENT"
echo === Git Status ===
git status
echo.
echo === Setting Remote ===
git remote set-url origin https://github.com/Codethriveinfotech/Om-murga-traders-FLEET.git
git remote -v
echo.
echo === Adding files ===
git add .
echo.
echo === Committing ===
git commit -m "Update Ohm Murga Traders project - Oct 2026"
echo.
echo === Pushing to main ===
git push origin main
echo.
echo === Push to master (if main fails) ===
git push origin master
echo.
echo === Done ===

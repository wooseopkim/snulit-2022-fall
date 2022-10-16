import { execSync } from "child_process";

execSync('npm run build:config');
execSync('npm run build:html');
execSync('npm run preview:pdf');

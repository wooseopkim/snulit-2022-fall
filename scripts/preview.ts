import { execSync } from "child_process";

execute('npm run build:config');
execute('npm run build:html');
execute('npm run preview:pdf');

function execute(command: string) {
  console.log(`executing ${command}...`);
  execSync(command);
}

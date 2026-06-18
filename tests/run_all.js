import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFiles = [
  'calculator.test.js',
  'habits.test.js',
  'assistant.test.js',
  'state.test.js'
];

console.log('🏁 Running all Sylva unit tests...');
let failed = false;

testFiles.forEach(file => {
  const filePath = resolve(__dirname, file);
  console.log(`\n----------------------------------------\n🏃 Running: ${file}`);
  
  const result = spawnSync('node', [filePath], { stdio: 'inherit' });
  
  if (result.status !== 0) {
    console.error(`❌ Test file failed: ${file}`);
    failed = true;
  } else {
    console.log(`✅ Test file passed: ${file}`);
  }
});

console.log('\n========================================');
if (failed) {
  console.error('❌ SOME TESTS FAILED! Please review the output above.');
  process.exit(1);
} else {
  console.log('🎉 ALL TEST SUITES PASSED SUCCESSFULLY!');
  process.exit(0);
}

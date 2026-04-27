import fs from 'fs';
let content = fs.readFileSync('src/views/ProfileView.tsx', 'utf8');
const lines = content.split('\n');

const newLines = [];
let idx = 0;
while (idx < lines.length) {
  if (lines[idx].includes('setSetupError("ভুল কোড।')) {
    newLines.push('        setSetupError("ভুল কোড। অনুগ্রহ করে আবার চেষ্টা করুন।");');
    newLines.push('      }');
    newLines.push('    } catch (error) {');
    newLines.push('      setSetupError("যাচাই করতে সমস্যা হয়েছে।");');
    newLines.push('    } finally {');
    newLines.push('      setIsVerifying(false);');
    newLines.push('    }');
    newLines.push('  };');
    newLines.push('');
    newLines.push('  return (');
    newLines.push('    <div className="space-y-6">');
    newLines.push('      {/* Security Center Section */}');
    idx++;
    continue;
  }
  newLines.push(lines[idx]);
  idx++;
}

fs.writeFileSync('src/views/ProfileView.tsx', newLines.join('\n'));

const { WechatyBuilder } = require('wechaty');

// #################################################################
// # 关键步骤：请将下方引号内的字符串，替换为您确信有效的 PadLocal Token #
// #################################################################
const MY_TOKEN = 'puppet_padlocal_191ac88755bd460f88be1ecc0a0ad0cc'; 

console.log('--- 开始诊断 ---');
console.log('使用的 Puppet: wechaty-puppet-padlocal');
console.log(`使用的 Token (前缀): ${MY_TOKEN.substring(0, 25)}...`);

const bot = WechatyBuilder.build({
  puppet: 'wechaty-puppet-padlocal', // 使用 PadLocal 专用包
  puppetOptions: {
    token: MY_TOKEN,
  }
});

bot.on('scan', (qrcode, status) => {
  console.log('--- 诊断成功！---');
  console.log('✅ 认证通过，服务器已成功返回二维码。');
  console.log('结论：您的 Token、网络环境和依赖包均无问题。');
  process.exit(0); // 成功后干净地退出程序
});

bot.on('error', (error) => {
  console.error('--- 诊断失败！---');
  console.error('❌ 程序收到 "error" 事件，这意味着机器人遇到了一个无法恢复的错误。');
  console.error('详细错误信息:', error);
  process.exit(1); // 失败后退出
});

console.log('正在调用 bot.start()，请稍候...');

bot.start()
  .catch(e => {
    console.error('--- 诊断失败！---');
    console.error('❌ "bot.start()" 进程异常终止。');
    console.error('这通常意味着在初始化阶段就发生了严重错误（如认证失败）。');
    console.error('详细错误信息:', e);
    process.exit(1); // 失败后退出
  });
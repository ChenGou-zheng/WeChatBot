// =======================================================
//          机器人主程序 (index.js)
// =======================================================
const { WechatyBuilder, log, ScanStatus, Message } = require('wechaty');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs/promises');

// 导入我们的配置文件
const config = require('./config.js');

// --- 1. 初始化 Wechaty 机器人 (基于诊断成功的配置) ---
const bot = WechatyBuilder.build({
  name: 'Group-Sync-Bot',
  puppet: 'wechaty-puppet-padlocal', // 使用 PadLocal 专用包
  puppetOptions: {
    token: config.WECHATY_PUPPET_PADLOCAL_TOKEN,
  },
});

// 全局变量，用于保存群聊对象的引用，避免重复查找
let sourceRoom = null;
const destinationRooms = [];

// --- 2. 核心功能：消息收集与写入文件 ---
async function messageCollector(message) {
  // 仅处理来自指定源群聊的消息
  if (!message.room() || !sourceRoom || message.room().id !== sourceRoom.id) {
    return;
  }
  // 仅处理文本消息
  if (message.type() !== Message.Type.Text) {
    return;
  }
  // 忽略机器人自己发的消息
  if (message.self()) {
    return;
  }

  const text = message.text();
  const talker = message.talker();

  // 根据关键词列表进行筛选 (如果列表为空，则所有消息都匹配)
  const isMatch = config.KEYWORD_FILTER.length === 0 || 
                  config.KEYWORD_FILTER.some(keyword => text.includes(keyword));

  if (isMatch) {
    log.info('Collector', `捕获到符合条件的消息 from [${talker.name()}]: "${text}"`);

    const messageData = {
      talkerName: talker.name(),
      text: text,
      timestamp: new Date().toISOString(),
    };

    // 将消息追加到数据文件
    try {
      let pendingMessages = [];
      try {
        const fileData = await fs.readFile(config.DATA_FILE_PATH, 'utf-8');
        pendingMessages = JSON.parse(fileData);
      } catch (e) {
        // 文件不存在或内容为空，属于正常情况，忽略错误
      }
      pendingMessages.push(messageData);
      await fs.writeFile(config.DATA_FILE_PATH, JSON.stringify(pendingMessages, null, 2));
    } catch (e) {
      log.error('Collector', '写入消息文件时出错:', e);
    }
  }
}

// --- 3. 核心功能：定时读取文件并转发 ---
async function messageSynchronizer() {
  log.info('Synchronizer', '开始执行定时同步任务...');

  if (destinationRooms.length === 0) {
    log.warn('Synchronizer', '没有找到任何有效的目标群聊，跳过本次同步。');
    return;
  }

  // 读取并清空待处理消息
  let messagesToSync = [];
  try {
    const fileData = await fs.readFile(config.DATA_FILE_PATH, 'utf-8');
    messagesToSync = JSON.parse(fileData);
    if (messagesToSync.length > 0) {
      // 清空文件，为下一个周期做准备
      await fs.writeFile(config.DATA_FILE_PATH, '[]');
    }
  } catch (e) {
    log.info('Synchronizer', '没有待同步的消息。');
    return;
  }

  if (messagesToSync.length === 0) {
    return;
  }

  // 格式化消息并发送
  const formattedHeader = `---【消息同步 ${new Date().toLocaleTimeString('zh-CN')}】---\n共 ${messagesToSync.length} 条新消息:\n`;
  const formattedMessages = messagesToSync.map(msg => 
    `\n[来自: ${msg.talkerName}]\n${msg.text}`
  ).join('\n--------------------\n');
  
  const combinedMessage = formattedHeader + formattedMessages;

  for (const room of destinationRooms) {
    try {
      await room.say(combinedMessage);
      log.info('Synchronizer', `成功转发到群聊: [${await room.topic()}]`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 礼貌性延迟1秒
    } catch (e) {
      log.error('Synchronizer', `转发到群聊 [${await room.topic()}] 失败:`, e);
    }
  }
}

// --- 4. 设置机器人事件响应 ---
bot
  .on('scan', (qrcode, status) => {
    if (status === ScanStatus.Waiting || status === ScanStatus.Scanned) {
      qrcodeTerminal.generate(qrcode, { small: true });
      log.info('Bot', `请扫描二维码登录: https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`);
    }
  })
  .on('login', async (user) => {
    log.info('Bot', `${user.name()} 已成功登录`);
    
    // 查找源头群
    sourceRoom = await bot.Room.find({ topic: config.SOURCE_ROOM_TOPIC });
    if (sourceRoom) {
      log.info('Setup', `成功锁定源头群: [${await sourceRoom.topic()}]`);
    } else {
      log.error('Setup', `启动失败: 未找到源头群 [${config.SOURCE_ROOM_TOPIC}]`);
      return;
    }

    // 查找所有目标群
    for (const topic of config.DESTINATION_ROOM_TOPICS) {
      const room = await bot.Room.find({ topic });
      if (room) {
        destinationRooms.push(room);
        log.info('Setup', `成功锁定目标群: [${await room.topic()}]`);
      } else {
        log.warn('Setup', `警告: 未找到目标群 [${topic}]`);
      }
    }

    // 启动定时任务
    const intervalMs = config.SYNC_INTERVAL_MINUTES * 60 * 1000;
    setInterval(messageSynchronizer, intervalMs);
    log.info('Setup', `设置成功！每隔 ${config.SYNC_INTERVAL_MINUTES} 分钟将执行一次同步任务。`);
  })
  .on('message', messageCollector)
  .on('error', (error) => {
    log.error('Bot', '机器人遇到错误:', error);
  });

// --- 5. 启动机器人 ---
bot.start()
  .then(() => log.info('Bot', '机器人正在启动...'))
  .catch(e => log.error('Bot', '机器人启动失败:', e));
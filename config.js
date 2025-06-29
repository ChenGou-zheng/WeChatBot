// =======================================================
//          机器人核心配置文件 (config.js)
// =======================================================

// --- 1. 身份凭证 ---
// 请将这里替换为您确信有效的 PadLocal Token
const WECHATY_PUPPET_PADLOCAL_TOKEN = 'puppet_padlocal_191ac88755bd460f88be1ecc0a0ad0cc'; 

// --- 2. 群聊配置 ---
// 消息来源群的【完整准确的】群聊名称
const SOURCE_ROOM_TOPIC = '书香世家';

// 目标群的【完整准确的】群聊名称列表 (可以是一个或多个)
const DESTINATION_ROOM_TOPICS = [
  '书香世家',
  '南瓜',
];

// --- 3. 筛选与同步 ---
// 消息文本需要包含的【关键词】列表。如果列表为空 `[]`，则转发所有消息。
const KEYWORD_FILTER = [
  'BUG',
  '故障',
  '紧急',
  'P0',
];

// 每隔多少分钟，执行一次转发任务
const SYNC_INTERVAL_MINUTES = 5;

// --- 4. 数据文件 ---
// 用于临时保存待转发消息的文件名
const DATA_FILE_PATH = 'pending_messages.json';


// --- 导出配置供主程序使用 ---
module.exports = {
  WECHATY_PUPPET_PADLOCAL_TOKEN,
  SOURCE_ROOM_TOPIC,
  DESTINATION_ROOM_TOPICS,
  KEYWORD_FILTER,
  SYNC_INTERVAL_MINUTES,
  DATA_FILE_PATH,
};
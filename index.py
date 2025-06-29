import time
import re
import qrcode
from io import BytesIO
from PIL import Image

from wechatpy import WeChatPYAPI
from wechatpy.session import SessionStorage

# ================= 配置信息 ================= #
PADLOCAL_TOKEN = "puppet_padlocal_191ac88755bd460f88be1ecc0a0ad0cc"  # 替换为你自己的 token
HOST = "127.0.0.1"
PORT = 8080

SOURCE_GROUP_ID = "书香世家"  # 替换为你要监听的群聊 ID
TARGET_GROUP_IDS = ["书香世家", "南瓜"]  # 多个目标群聊 ID 列表

FILTER_KEYWORDS = r"重要通知|紧急|项目更新"  # 正则表达式筛选条件

# ================= 初始化机器人 ================= #

session = SessionStorage()
bot = WeChatPYAPI(
    padlocal_token=PADLOCAL_TOKEN,
    host=HOST,
    port=PORT,
    session=session
)

# ================= 回调函数：扫码登录 ================= #

def on_qr_code(qr_code):
    """接收二维码回调并显示"""
    print("📱 正在生成登录二维码...")
    qr = qrcode.make(qr_code)
    bio = BytesIO()
    qr.save(bio)
    img = Image.open(BytesIO(bio.getvalue()))
    img.show()  # 自动打开系统默认图像查看器显示二维码
    print("✅ 请用微信扫码登录...")

# ================= 回调函数：登录成功 ================= #

def on_login():
    print("🟢 登录成功！开始执行消息同步任务...")
    start_forwarding()

# ================= 回调函数：接收到消息 ================= #

def on_message(msg):
    print("📨 接收到消息:", msg)

# ================= 消息转发逻辑 ================= #

def start_forwarding():
    """启动定时任务或立即执行一次转发"""
    from apscheduler.schedulers.background import BackgroundScheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(sync_messages, 'interval', minutes=5)
    scheduler.start()
    print("⏰ 已启动每 5 分钟一次的消息同步任务。")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 程序已退出。")

def sync_messages():
    print("\n🔄 开始执行消息同步任务...")
    try:
        messages = bot.get_chatroom_msg(SOURCE_GROUP_ID)
        filtered = [msg for msg in messages if re.search(FILTER_KEYWORDS, msg["content"])]

        if not filtered:
            print("🔔 未发现符合条件的消息")
            return

        print(f"🔍 发现 {len(filtered)} 条符合条件的消息")

        for msg in filtered:
            content = msg["content"]
            user = msg.get("sender", "未知用户")
            formatted = f"[来自 {user}]:\n{content}"

            for group_id in TARGET_GROUP_IDS:
                bot.send_text_message(chatroom_id=group_id, content=formatted)
                print(f"✅ 已发送到群 {group_id}")

    except Exception as e:
        print(f"❗ 同步失败: {e}")

# ================= 主程序入口 ================= #

if __name__ == "__main__":
    print("🤖 正在启动微信机器人...")

    # 设置回调
    bot.on("qr_code", on_qr_code)
    bot.on("login", on_login)
    bot.on("message", on_message)

    # 启动机器人
    bot.start()

    # 保持主线程运行
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("🛑 正在关闭机器人...")
        bot.stop()
        print("👋 机器人已停止。")
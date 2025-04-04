import telebot
from telebot import types
from dotenv import load_dotenv
import os

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = telebot.TeleBot(BOT_TOKEN)

ADMIN_CHAT_ID = 1195158333  # Ваш ID для получения отзывов

@bot.message_handler(commands=['start'])
def handler_start(message):
    bot.send_message(message.chat.id, 'Приветствую!')
    bot.send_message(message.chat.id, 'Этот бот-кроссворд предназначен для "убийства" времени, если вам скучно.')
    
    markup = types.InlineKeyboardMarkup(row_width=2)
    web_app_url = "https://polina-shupikova.github.io/NPI/%D0%9F%D0%A0%D0%9E%D0%95%D0%9A%D0%A2/MAIN/"
    btn_yes = types.InlineKeyboardButton(
        text="Да",
        web_app=types.WebAppInfo(url=web_app_url)
    )
    btn_no = types.InlineKeyboardButton("Нет", callback_data="no")
    
    markup.add(btn_yes, btn_no)
    bot.send_message(message.chat.id, "Начать?", reply_markup=markup)

@bot.message_handler(commands=['help'])
def handler_help(message):
    help_text = """
📚 Доступные команды:

/start - Начать работу с ботом
/help - Показать это справочное сообщение
/feedback - Оставить отзыв о работе бота
"""
    bot.send_message(message.chat.id, help_text, parse_mode="Markdown")

@bot.message_handler(commands=['feedback'])
def handler_feedback(message):
    markup = types.InlineKeyboardMarkup()
    feedback_btn = types.InlineKeyboardButton("📝 Написать отзыв", callback_data="leave_feedback")
    markup.add(feedback_btn)
    
    bot.send_message(message.chat.id, "Хотите оставить отзыв о боте?", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data == "leave_feedback")
def handle_feedback_callback(call):
    bot.answer_callback_query(call.id)
    msg = bot.send_message(call.from_user.id, "Пожалуйста, напишите ваш отзыв о боте:")
    bot.register_next_step_handler(msg, process_feedback)

def process_feedback(message):
    if message.text:
        try:
            feedback_text = (
                f"📝 Новый отзыв от пользователя:\n"
                f"👤 ID: {message.from_user.id}\n"
                f"📛 Имя: @{message.from_user.username}\n\n"
                f"✉️ Текст:\n{message.text}"
            )
            bot.send_message(ADMIN_CHAT_ID, feedback_text)
            bot.send_message(message.chat.id, "Спасибо за ваш отзыв! Он был передан разработчику.")
        except Exception as e:
            print(f"Ошибка при отправке отзыва: {e}")
            bot.send_message(message.chat.id, "Произошла ошибка при отправке отзыва. Пожалуйста, попробуйте позже.")
    else:
        bot.send_message(message.chat.id, "Вы отправили пустое сообщение. Пожалуйста, напишите ваш отзыв текстом.")

@bot.callback_query_handler(func=lambda call: call.data == "no")
def handle_no_callback(call):
    bot.send_message(call.message.chat.id, "Плаке плаке")

if __name__ == '__main__':
    bot.polling(none_stop=True)
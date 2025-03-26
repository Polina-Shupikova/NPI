import telebot
from telebot import types
from dotenv import load_dotenv
import os

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def handler_start(message):
    bot.send_message(message.chat.id, 'Приветствую, товарищ!')
    bot.send_message(message.chat.id, 'Этот бот-кроссворд предназначен для контроля лексического словарного запаса среди нашего пролетариата.')
    
    markup = types.InlineKeyboardMarkup(row_width=2)
    web_app_url = "https://example.com"
    btn_yes = types.InlineKeyboardButton(
        text="Да",
        web_app=types.WebAppInfo(url=web_app_url)
    )
    btn_no = types.InlineKeyboardButton("Нет", callback_data="no")
    
    markup.add(btn_yes, btn_no)
    bot.send_message(message.chat.id, "Начать?", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.data == "no":
        bot.send_message(call.message.chat.id, "Плаке плаке")

if __name__ == '__main__':
    bot.polling(none_stop=True)
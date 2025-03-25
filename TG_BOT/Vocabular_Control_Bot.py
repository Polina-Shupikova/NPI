import telebot
from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def handler_start(message):
    bot.send_message(message.chat.id, 'Приветствую товарищ!')
    bot.send_message(message.chat.id, 'Этот бот-кроссворд предназначем для контроля лексического словарного запаса среди нашего пролетариата')
    markup = types.InlineKeyboardMarkup(row_width=2)
    btn_yes = types.InlineKeyboardButton("Да", callback_data="yes")
    btn_no = types.InlineKeyboardButton("Нет", callback_data="no")

    bot.send_message(message.chat.id, "Начать?", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.data == "yes":
        bot.send_message(call.message.chat.id, "Вы выбрали Да! ✅")
    elif call.data == "no":
        bot.send_message(call.message.chat.id, "Вы выбрали Нет! ❌")

if __name__ == '__main__':
    bot.polling(none_stop=True)
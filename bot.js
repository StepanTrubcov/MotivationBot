import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { addProfile, initializeUserGoals, checkGoalCompletion, getAllStatus, addPoints, addCompletedDate, getGeneraleText } from './Api/Api.js';
import cron from 'node-cron';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = 'https://motivation-oz64.vercel.app/?startapp=story';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required in .env');
}

let userIdApi = null;
let goalsApi = null;
let userData = null
const selectedByMessage = new Map();

const activeUsers = new Set();

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const loading = await ctx.reply('⏳ Подождите! Проверяем авторизацию.');
  try {
    const profile = await addProfile(ctx);
    userIdApi = profile?.id
    userData = profile
    activeUsers.add(ctx.from.id);
  } catch (_) {
    userIdApi = ctx.from.id;
    activeUsers.add(ctx.from.id);
  }

  if (userData) {
    await ctx.deleteMessage(loading.message_id);
    await ctx.reply(
      `❄️ *Winter Arc запущен!* ❄️\n\n` +
      `👋 ${ctx.from.first_name}, хватит ждать — пришло время действовать.\n\n` +
      `🔥 Эта зима — проверка на прочность. Или ты растёшь и становишься сильнее, или остаёшься там же, где был.\n` +
      `🚀 Время прокачать дисциплину, привычки и характер. Здесь нет места слабости.\n\n` +
      `⚔️ *Winter Arc — это твой вызов.* Ответишь ли ты на него? 💀\n\n` +
      `Выбирай действие прямо сейчас:`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Открыть приложение', WEB_APP_URL)],
        [Markup.button.callback('📋 Мои цели', 'show_goals')],
      ])
    );
  }

});

bot.command('goals', async (ctx) => {
  console.log(userIdApi)
  const loading = await ctx.reply('⏳ Загружаем твои цели...');

  try {
    const uid = userIdApi;
    const goalsTime = await checkGoalCompletion(uid);
    const goals = await initializeUserGoals(uid);

    goalsApi = goalsTime || goals;

    await ctx.deleteMessage(loading.message_id);

    return ctx.reply(
      `📋 Выбери категорию целей:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🟡 Цели в процессе', 'in_progress_goals')],
        [Markup.button.callback('✅ Выполненные цели', 'done_goals')],
        [Markup.button.callback('❌ Закрыть', 'close_message')],
      ])
    );
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Ошибка при загрузке целей, попробуй позже.');
  }
});

bot.command('winter_arc', async (ctx) => {
  await ctx.replyWithMarkdown(
    `❄️ *W I N T E R  A R C* ❄️\n\n` +
    `Это не просто зима.\n` +
    `Это время, когда мир замедляется, а ты — ускоряешься.\n\n` +
    `Пока другие прячутся в тепло и ждут весну, ты прокачиваешь дисциплину, характер и силу воли.\n\n` +
    `🔥 Winter Arc — это твой личный сезон роста.\n` +
    `Без жалости. Без отговорок. Только ты, цели и холод, который проверяет, кто ты на самом деле.\n\n` +
    `Каждый день — шаг через мороз, лень и слабость.\n` +
    `Каждое действие — удар по старому себе.\n\n` +
    `⚔️ Не выживешь — останешься тем, кем был.\n` +
    `Пройдёшь до конца — выйдешь из Winter Arc другим человеком.\n\n` +
    `💀 *Добро пожаловать в холод. Пора действовать.*`,
    Markup.inlineKeyboard([
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  )
});

bot.command('mini_aps', async (ctx) => {
  await ctx.replyWithMarkdown(
    `⚔️ Мини приложение *Дневные достижения*\n\n`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Открыть приложение', WEB_APP_URL)],
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.command('generate', async (ctx) => {
  await ctx.replyWithMarkdown(
    `⚔️ *Генератор отчёта.*\n\n` +
    `Каждая цель — это не просто задача, это удар по слабости.\n\n` +
    `Сгенерируй отчёт о своих целях на сегодня — и поделись им в канале или группе. 💀`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🔥 Сгенерировать отчёт', 'generation')],
      [Markup.button.callback('🏆 Прошлый отчёт', 'generationLast')],
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.action('generationLast', async (ctx) => {
  const loading = await ctx.reply('⏳ Ищем прошлый отчёт');
  const profile = await addProfile(ctx);
  userData = profile
  const uid = profile?.id;

  const goalsTime = await checkGoalCompletion(uid);
  const goals = await initializeUserGoals(uid);
  goalsApi = goalsTime || goals;

  const goalsInProgress = goalsApi.filter(g => g.status === 'in_progress');
  const goalsDone = goalsApi.filter(g => g.status === 'completed');

  if (goalsInProgress.length === 0 && goalsDone.length === 0) {
    await ctx.deleteMessage(loading.message_id);
    return ctx.reply('😴 Пока ничего нет — пора действовать. Возьми цели и начни движение.');
  }

  try {
    await getGeneraleText(userData.telegramId, goalsDone, goalsInProgress);

    const profile = await addProfile(ctx);

    let yesterdayReport = profile?.yesterdayReport

    await ctx.deleteMessage(loading.message_id);

    if (yesterdayReport[0]) {
      await ctx.reply(yesterdayReport[0].text);
    } else {
      await ctx.reply('Нету прошлого отчёта!');
    }

  } catch (err) {
    console.error('Ошибка генерации:', err);
    await ctx.deleteMessage(loading.message_id);
    await ctx.reply('Что-то пошло не так при поиске прошлого отчёта. Попробуй снова.');
  }
});

bot.command('info', async (ctx) => {
  await ctx.replyWithMarkdown(
    `ℹ️ *Информация о Дневных дотижениях*\n\n` +
    `Этот бот и мини-приложение созданы, чтобы помочь тебе системно прокачивать дисциплину, вырабатывать привычки и двигаться к своим целям.\n\n` +

    `📌 *Как это работает:*\n` +
    `1️⃣ Через кнопку "🚀 Открыть приложение" ты попадаешь в мини-приложение.\n` +
    `2️⃣ Там ты можешь:\n` +
    `   • Брать цели на 30 дней.\n` +
    `   • Отмечать их выполнение.\n` +
    `   • Получать очки за прогресс.\n` +
    `   • Открывать достижения.\n` +
    `   • Смотреть календарь активности.\n` +
    `   • Генерировать отчёт для соцсетей или канала.\n` +
    `3️⃣ В боте можно делать почти то же самое — поэтому не обязательно постоянно заходить в мини-приложение.\n\n` +

    `🔥 За каждую выполненную цель ты получаешь баллы — они отражают твою стабильность, силу воли и прогресс.\n\n` +

    `❄️ *Winter Arc* — сезонная часть проекта.  
    Его суть в том, чтобы прожить зиму не впустую: выстроить привычки, укрепить дисциплину и не дать себе остановиться.\n\n` +

    `🧭 Используй бота и мини-приложение каждый день.  
    Маленькие шаги, сделанные стабильно — это и есть путь к реальным результатам.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.action('generation', async (ctx) => {
  const loading = await ctx.reply('⏳ Генерируем твоё сообщение...');

  const uid = userIdApi;

  const goalsTime = await checkGoalCompletion(uid);
  const goals = await initializeUserGoals(uid);
  goalsApi = goalsTime || goals;

  const goalsInProgress = goalsApi.filter(g => g.status === 'in_progress');
  const goalsDone = goalsApi.filter(g => g.status === 'completed');

  if (goalsInProgress.length === 0 && goalsDone.length === 0) {
    await ctx.deleteMessage(loading.message_id);
    return ctx.reply('😴 Пока ничего нет — пора действовать. Возьми цели и начни движение.');
  }

  try {
    const generateText = await getGeneraleText(userData.telegramId, goalsDone, goalsInProgress);

    await ctx.deleteMessage(loading.message_id);

    await ctx.replyWithMarkdown(
      `⚡ *Готово!*  
      Сообщение собрано — это твой сегодняшний отчёт.  
      Скопируй или пересылай его в канал, группу или друзьям.  
      Пусть видят, что ты *в игре*. 🧊🔥`,
      { parse_mode: 'Markdown' }
    );

    await ctx.reply(generateText);

  } catch (err) {
    console.error('Ошибка генерации:', err);
    await ctx.deleteMessage(loading.message_id);
    await ctx.reply('❌ Что-то пошло не так при генерации сообщения. Попробуй снова.');
  }
});

bot.action('show_goals', async (ctx) => {
  const loading = await ctx.reply('⏳ Загружаем твои цели...');

  try {
    const uid = userIdApi;
    const goalsTime = await checkGoalCompletion(uid);
    const goals = await initializeUserGoals(uid);

    goalsApi = goalsTime || goals;

    await ctx.deleteMessage(loading.message_id);

    return ctx.reply(
      `📋 Выбери категорию целей:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🟡 В процессе', 'in_progress_goals')],
        [Markup.button.callback('✅ Выполненные цели', 'done_goals')],
        [Markup.button.callback('❌ Закрыть', 'close_message')],
      ])
    );
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Ошибка при загрузке целей, попробуй позже.');
  }
});

bot.action('done_goals', async (ctx) => {
  const loading = await ctx.reply('⏳ Проверяем выполненные цели...');

  try {
    const uid = userIdApi;
    const goalsTime = await checkGoalCompletion(uid);
    const goals = await initializeUserGoals(uid);

    goalsApi = goalsTime || goals;

    await ctx.deleteMessage(loading.message_id);
    await ctx.answerCbQuery();

    const done = (goalsApi || []).filter(g => g.status === "completed");
    if (done.length === 0)
      return ctx.reply('✅ Сегодня нет выполненных целей.', Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'close_message')],
      ]));

    const msg = done.map((g, i) => `• ${g.title}`).join('\n');
    await ctx.reply(
      `✅ Выполненные сегодня цели:\n\n${msg}`,
      Markup.inlineKeyboard([[Markup.button.callback('❌ Закрыть', 'close_message')]])
    );
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Ошибка при загрузке целей.');
  }
});

function buildInProgressKeyboard(inProgress, selectedSet) {
  const maxLen = Math.max(...inProgress.map(g => g.title.length));

  const rows = inProgress.map(goal => {
    const isSelected = selectedSet.has(goal.id);
    const marker = isSelected ? '🟢' : '⚪️';

    const diff = maxLen - goal.title.length;
    const pad = ' '.repeat(diff); 
    return [
      Markup.button.callback(
        `${marker} ${goal.title}${pad}`,
        `toggle_goal_${goal.id}`
      )
    ];
  });

  rows.push([Markup.button.callback('✅ Выполнить', 'Done_goals')]);
  rows.push([Markup.button.callback('❌ Закрыть', 'close_message')]);

  return Markup.inlineKeyboard(rows, { columns: 1 });
}

bot.action('in_progress_goals', async (ctx) => {
  const loading = await ctx.reply('⏳ Загружаем цели в процессе...');

  try {
    const uid = userIdApi;
    const goalsTime = await checkGoalCompletion(uid);
    const goals = await initializeUserGoals(uid);

    goalsApi = goalsTime || goals;

    await ctx.deleteMessage(loading.message_id);
    await ctx.answerCbQuery();

    const inProgress = (goalsApi || []).filter(g => g.status === 'in_progress');
    if (inProgress.length === 0) {
      return ctx.reply(`Пока нет целей в процессе.\n` + `Зайдите в мини приложение и возьмите себе целей`, Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'close_message')],
      ]));
    }

    const text =
      `*Цели в процессе*\n\n` +
      `Отметь выполненные задачи (нажми на них, чтобы поставить зелёную галочку), затем нажми "✅ Выполнить".`;

    const sent = await ctx.replyWithMarkdown(text, buildInProgressKeyboard(inProgress, new Set()));

    selectedByMessage.set(sent.message_id, new Set());
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Ошибка при загрузке целей.');
  }
});

bot.action(/^toggle_goal_(.+)$/, async (ctx) => {
  const goalId = ctx.match[1];
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  await ctx.answerCbQuery();

  if (!msgId) return;

  const current = selectedByMessage.get(msgId) || new Set();
  current.has(goalId) ? current.delete(goalId) : current.add(goalId);
  selectedByMessage.set(msgId, current);

  const inProgress = (goalsApi || []).filter(g => g.status === 'in_progress');
  try {
    await ctx.editMessageReplyMarkup(
      buildInProgressKeyboard(inProgress, current).reply_markup
    );
  } catch (e) {
    console.error('editMessageReplyMarkup error:', e.message);
  }
});

bot.action('Done_goals', async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  const selected = selectedByMessage.get(msgId) || new Set();

  if (selected.size === 0) {
    return ctx.answerCbQuery('⚠️ Нет выбранных целей!', { show_alert: true });
  }

  const chosen = (goalsApi || []).filter(g => selected.has(g.id));

  const loading = await ctx.reply('⏳ Обновляем цели...');

  const until = new Date().toISOString().slice(0, 10);

  try {
    await Promise.all(
      chosen.map(g => {
        getAllStatus(userIdApi, g.id, 'done')
        addPoints(userIdApi, g.points)
        addCompletedDate(userData.telegramId, until)
      })
    );

    await ctx.deleteMessage(loading.message_id);

    const resultText =
      `🎉 Отличная работа!\n\n` +
      `Цели были добавлены в раздел "✅ Выполненные цели".\n\n` +
      `Продолжай в том же духе 💪🔥`;

    await ctx.editMessageText(resultText, { reply_markup: { inline_keyboard: [] } });
  } catch (e) {
    console.error('Done_goals error:', e.message);
    await ctx.reply('❌ Ошибка при обновлении целей, попробуй ещё раз.');
  } finally {
    selectedByMessage.delete(msgId);
  }
});

bot.action('close_message', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {
    console.error('close_message error:', e.message);
  }
});

bot.command('developer', async (ctx) => {
  await ctx.replyWithMarkdown(
    `👨‍💻 *Разработчик проекта*\n\n` +
    `Этот бот и мини-приложение созданы двумя людьми — из желания помочь вам стать дисциплинированнее, сильнее и стабильнее.\n\n` +
    `Если у тебя есть предложения, баги или идеи — не стесняйся писать!\n\n` +
    `📨 Связаться можно по кнопке ниже 👇`,
    Markup.inlineKeyboard([
      [Markup.button.url('✉️ Написать разработчику', 'https://t.me/Stepan4853')],
      [Markup.button.callback('❌ Закрыть', 'close_message')]
    ])
  );
});

bot.command('support', async (ctx) => {
  await ctx.replyWithPhoto(
    { source: './Img/qr.jpg' },
    {
      caption:
        `💚 *Поддержка проекта*\n\n` +
        `Если тебе нравится бот и приложение — ты можешь поддержать развитие проекта.\n\n` +
        `Спасибо, что ты с нами. ❄️`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('💸 Поддержать проект', 'https://www.tinkoff.ru/rm/r_adpKgpwYuC.VvrLvQmxSb/GjWkK97277')],
        [Markup.button.callback('❌ Закрыть', 'close_message')],
      ]),
    }
  );
});

bot.launch();
console.log('Бот запущен ✅');

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
  
  cron.schedule('0 9 * * *', () => {
    sendDailyReminders('morning');
  });
  
  cron.schedule('0 19 * * *', () => {
    sendDailyReminders('evening');
  });
  
  console.log('Ежедневные напоминания запланированы');
});

async function sendDailyReminders(timeOfDay) {
  const reminderMessages = {
    morning: [
      `🌅 Доброе утро! Не забудь про свои цели на сегодня!\n\nПроверь, что планируешь сделать сегодня для достижения своих целей.`,
      `🌤 Утро началось! Время вспомнить о своих целях.\n\nСделай шаг к лучшей версии себя прямо сейчас!`,
      `☀️ Новый день - новые возможности! Не забудь поработать над своими целями сегодня.`
    ],
    evening: [
      `🌙 Вечер настал. Не забудь сгенерировать отчёт о проделанной работе!\n\nНажми /generate чтобы поделиться своими достижениями.`,
      `🌇 День подходит к концу. Время подвести итоги и сгенерировать отчёт о своих целях!`,
      `🌆 Вечер - время отчета! Поделись своими достижениями за день с помощью команды /generate`
    ]
  };
  
  const isMorning = timeOfDay === 'morning';
  const messages = reminderMessages[timeOfDay];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  for (const userId of activeUsers) {
    try {
      await bot.telegram.sendMessage(userId, randomMessage, {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('📋 Мои цели', 'show_goals')],
            [Markup.button.callback('📊 Сгенерировать отчёт', 'generation')],
            [Markup.button.webApp('🚀 Открыть приложение', WEB_APP_URL)]
          ]
        }
      });
    } catch (error) {
      console.error(`Не удалось отправить напоминание пользователю ${userId}:`, error.message);
      
    if (error.code === 403) {
        activeUsers.delete(userId);
      }
    }
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { getAllUserIds, getUserData, generateSavingGoalsReport, getAllGoals, getUserSavingGoals, clearAllSavingGoals, getUserSavingGoalsWithAutoPeriod, updateSavingGoalStatus, addProfile, initializeUserGoals, checkGoalCompletion, getAllStatus, addPoints, getGeneraleText } from './Api/Api.js';
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
    const goals = await initializeUserGoals(userIdApi);
  } catch (_) {
    userIdApi = ctx.from.id;
    activeUsers.add(ctx.from.id);
  }
  if (userData) {
    await ctx.deleteMessage(loading.message_id);
    await ctx.replyWithMarkdown(
      `❄️ *Winter Arc запущен!* ❄️\n\n` +
      `👋 ${ctx.from.first_name}, хватит ждать — пришло время действовать.\n\n` +
      `🔥 Эта зима — проверка на прочность. Или ты растёшь и становишься сильнее, или остаёшься там же, где был.\n` +
      `🚀 Время прокачать дисциплину, привычки и характер. Здесь нет места слабости.\n\n` +
      `⚔️ *Winter Arc — это твой вызов.* Ответишь ли ты на него? 💀\n\n` +
      `Наш телеграм канал *@Motivation_bot_channel*\n` +
      `Бот с часто задаваемыми вопросами *@keep_alive_Assistant_bot*\n\n` +
      `Выбирай действие прямо сейчас:`,
      Markup.inlineKeyboard([
        [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
        [Markup.button.callback('📋 Мои цели', 'show_goals')],
      ])
    );
  }

});

bot.command('goals', async (ctx) => {
  const loading = await ctx.reply('⏳ Загружаем твои цели...');

  try {
    const profile = await addProfile(ctx);
    const uid = profile?.id;
    if (uid) {
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
    }
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
    `⚔️ Мини-приложение *Дневные достижения*\n\n`,
    Markup.inlineKeyboard([
      [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.telegram.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: 'Open',
    web_app: {
      url: WEB_APP_URL
    }
  }
});

bot.command('generate', async (ctx) => {
  await ctx.replyWithMarkdown(
    `⚔️ *Генератор отчёта.*\n\n` +
    `Каждая цель — это не просто задача, это удар по слабости.\n\n` +
    `Сгенерируй отчёт о своих целях на сегодня — и поделись им в канале или группе. 💀`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🔥 Сгенерировать отчёт', 'generation')],
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.action('generationLast', async (ctx) => {
  const loading = await ctx.reply('⏳ Ищем прошлый отчёт');
  const profile = await addProfile(ctx);
  userData = profile
  const uid = profile?.id;
  const userTag = profile?.usersTag;

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
    if (userData.telegramId) {
      await getGeneraleText(userTag, userData.telegramId, goalsDone, goalsInProgress);

      const profile = await addProfile(ctx);

      let yesterdayReport = profile?.yesterdayReport

      await ctx.deleteMessage(loading.message_id);

      if (yesterdayReport[0]) {
        await ctx.reply(yesterdayReport[0].text);
      } else {
        await ctx.reply('Нет прошлого отчёта!');
      }
    }
  } catch (err) {
    console.error('Ошибка генерации:', err);
    await ctx.deleteMessage(loading.message_id);
    await ctx.reply('Что-то пошло не так при поиске прошлого отчёта. Попробуй снова.');
  }
});

bot.command('info', async (ctx) => {
  await ctx.replyWithMarkdown(
    `ℹ️ *Информация о Дневных достижениях*\n\n` +
    `Этот бот и мини-приложение созданы, чтобы помочь тебе системно прокачивать дисциплину, вырабатывать привычки и двигаться к своим целям.\n\n` +

    `📌 *Как это работает:*\n` +
    `1️⃣ Через кнопку "🚀 Открыть приложение" ты попадаешь в мини-приложение.\n` +
    `2️⃣ Там ты можешь:\n` +
    `   • Брать цели на 30, 60, 120 дней.\n` +
    `   • Отмечать их выполнение.\n` +
    `   • Получать очки за прогресс.\n` +
    `   • Получать достижения.\n` +
    `   • Смотреть календарь активности.\n` +
    `   • Генерировать отчёт для соцсетей или канала.\n` +
    `3️⃣ В боте можно делать почти то же самое — поэтому не обязательно постоянно заходить в мини-приложение, но также бот будет каждую неделю и каждый месяц присылать большой отчёт с графиком!\n\n` +

    `🔥 За каждую выполненную цель ты получаешь очки — они отражают твою стабильность, силу воли и прогресс.\n\n` +

    `❄️ *Winter Arc* — сезонная часть проекта.  
    Его суть в том, чтобы прожить зиму не впустую: выстроить привычки, укрепить дисциплину и не дать себе остановиться.\n\n` +

    `🧭 Используй бота и мини-приложение каждый день.  
    Маленькие шаги, сделанные стабильно — это и есть путь к реальным результатам.\n\n` +
    `Если у вас возникли какие-то вопросы, вы можете найти на них ответ в этом боте @keep\\_alive\\_Assistant\\_bot или же вы можете написать в комментарии в нашем канале *@Motivation_bot_channel*`,
    Markup.inlineKeyboard([
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.action('generation', async (ctx) => {
  const loading = await ctx.reply('⏳ Генерируем твоё сообщение...');
  try {
    const profile = await addProfile(ctx);
    const uid = profile?.id;
    userData = profile
    const userTag = profile?.usersTag
    if (uid) {
      const goalsTime = await checkGoalCompletion(uid);
      const goals = await initializeUserGoals(uid);
      goalsApi = goalsTime || goals;

      const goalsInProgress = goalsApi.filter(g => g.status === 'in_progress');
      const goalsDone = goalsApi.filter(g => g.status === 'completed');

      if (goalsInProgress.length === 0 && goalsDone.length === 0) {
        await ctx.deleteMessage(loading.message_id);
        return ctx.reply('😴 Пока ничего нет — пора действовать. Возьми цели и начни движение.');
      }


      const generateText = await getGeneraleText(userTag, userData.telegramId, goalsDone, goalsInProgress);

      await ctx.deleteMessage(loading.message_id);

      await ctx.replyWithMarkdown(
        `⚡ *Готово!*\n` +
        `Сообщение собрано — это твой сегодняшний отчёт.\n` +
        `Скопируй или пересылай его в канал, группу или друзьям.\n` +
        `Пусть видят, что ты *в игре*. 🧊🔥`,
        { parse_mode: 'Markdown' }
      );

      await ctx.reply(generateText);
    }
  } catch (err) {
    console.error('Ошибка генерации:', err);
    await ctx.deleteMessage(loading.message_id);
    await ctx.reply('❌ Что-то пошло не так при генерации сообщения. Попробуй снова.');
  }
});

bot.action('show_goals', async (ctx) => {
  const loading = await ctx.reply('⏳ Загружаем твои цели...');

  try {
    const profile = await addProfile(ctx);
    const uid = profile?.id;
    if (uid) {
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
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Ошибка при загрузке целей, попробуй позже.');
  }

});

bot.action('done_goals', async (ctx) => {
  const loading = await ctx.reply('⏳ Проверяем выполненные цели...');

  try {
    const profile = await addProfile(ctx);
    const uid = profile?.id;
    if (uid) {
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
    }
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

  rows.push([Markup.button.callback('✅ Выполнить', 'Done_goals')])
  rows.push([Markup.button.callback('❌ Закрыть', 'close_message')]);

  return Markup.inlineKeyboard(rows, { columns: 1 });
}

bot.action('in_progress_goals', async (ctx) => {
  const loading = await ctx.reply('⏳ Загружаем цели в процессе...');

  try {
    const profile = await addProfile(ctx);
    const uid = profile?.id;
    if (uid) {
      const goalsTime = await checkGoalCompletion(uid);
      const goals = await initializeUserGoals(uid);

      goalsApi = goalsTime || goals;

      await ctx.deleteMessage(loading.message_id);
      await ctx.answerCbQuery();

      const inProgress = (goalsApi || []).filter(g => g.status === 'in_progress');
      if (inProgress.length === 0) {
        return ctx.reply(`Нет целей в процессе.\n` + `Возможно вы их не взяли или уже все выполнили`, Markup.inlineKeyboard([
          [Markup.button.callback('❌ Закрыть', 'close_message')],
        ]));
      }

      const text =
        `*Цели в процессе*\n\n` +
        `Отмете задачи (нажми на них, чтобы поставить зелёную галочку), затем нажмите на ✅ Выполнить`;

      const sent = await ctx.replyWithMarkdown(text, buildInProgressKeyboard(inProgress, new Set()));

      selectedByMessage.set(sent.message_id, new Set());
    }
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

bot.action('Delete_goals', async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  const selected = selectedByMessage.get(msgId) || new Set();

  if (selected.size === 0) {
    return ctx.answerCbQuery('⚠️ Нет выбранных целей!', { show_alert: true });
  }

  const chosen = (goalsApi || []).filter(g => selected.has(g.id));

  const loading = await ctx.reply('⏳ Удаляем цели...');

  const until = new Date().toISOString().slice(0, 10);

  try {
    await Promise.all(
      chosen.map(async (g) => {
        try {
          const profile = await addProfile(ctx);
          const uid = profile?.id;
          const telegramId = profile?.telegramId
          if (uid) {
            if (g.status === 'completed') {
              await removePoints(uid, g.points)
              await deleteCompletedDate(telegramId, until)
            }
            await getAllStatus(uid, g.id, 'not_started')
            await removeSavingGoalFromToday(telegramId, g.id)
          }
        } catch (e) {

        }
      })
    );

    await ctx.deleteMessage(loading.message_id);

    const resultText =
      `Успешно удалено!\n\n` +
      `Цели были добавлены в раздел "Все".\n\n` +
      `Вы можете снова добавить эти цели в приложении!`;

    await ctx.editMessageText(resultText, { reply_markup: { inline_keyboard: [] } });
  } catch (e) {
    console.error('Delete_goals error:', e.message);
    await ctx.reply('❌ Ошибка при удалении целей, попробуй ещё раз.');
  } finally {
    selectedByMessage.delete(msgId);
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
    // Выполняем операции последовательно, а не параллельно
    for (const g of chosen) {
      try {
        const profile = await addProfile(ctx);
        const uid = profile?.id;
        const telegramId = profile?.telegramId
        if (uid) {
          // Выполняем операции последовательно
          getAllStatus(uid, g.id, 'done')
          addPoints(uid, g.points)

          // Ждем завершения updateSavingGoalStatus
          try {
            await updateSavingGoalStatus(telegramId, until, g.id, "completed")
            console.log('470 - Цель обновлена успешно:', g.id)
          } catch (updateError) {
            console.error('Ошибка при обновлении статуса цели:', g.id, updateError)
          }
        }
      } catch (e) {
        console.error('Ошибка при обработке цели:', g.id, e)
      }
    }

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

bot.command('channel', async (ctx) => {
  await ctx.reply(
    `НОВОСТИ ПО БОТУ И ПРИЛОЖЕНИЮ\n\n` +
    `Этот бот и мини-приложение очень активно прокачиваются и обновляются.\n\n` +
    `Чтобы знать все изменения и знать все крутые фичи вы можете подписаться на наш канал!\n\n` +
    `Там мы постим все изменения и новые фичи !!! \n\n` +
    `@Motivation_bot_channel`,
    Markup.inlineKeyboard([
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
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url('💸 Поддержать проект', 'https://www.tinkoff.ru/rm/r_adpKgpwYuC.VvrLvQmxSb/GjWkK97277')],
        [Markup.button.callback('❌ Закрыть', 'close_message')],
      ]).reply_markup
    }
  );
});

bot.command('a', async (ctx) => {
  sendWeeklyReport()
});

bot.launch();
console.log('Бот запущен ✅');

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;

  // 7 утра
  cron.schedule('0 4 * * *', () => {
    sendDailyReminders('morning');
  });

  // 9 вечера
  cron.schedule('0 18 * * *', () => {
    sendDailyReminders('evening');
  });


  // каждое воскресенье в 10 утра
  cron.schedule('0 7 * * 0', () => {
    sendWeeklyReport();
  });

  console.log('Ежедневные напоминания запланированы на 7:00 и 21:00 по Московскому времени');
});

async function sendWeeklyReport() {
  try {
    // Получаем все Telegram ID пользователей
    const telegramUsers = await getAllUserIds();
    const mapTelegramId = telegramUsers.map(t => t.telegramId);

    console.log(`Найдено ${mapTelegramId.length} пользователей для отправки отчетов`);

    // Обрабатываем каждого пользователя по очереди
    for (const userId of mapTelegramId) {
      try {
        console.log(`Отправка отчета пользователю: ${userId}`);

        // Получаем данные пользователя
        const profile = await getUserData(userId);
        if (!profile || !profile.id) {
          console.log(`Пользователь с ID ${userId} не найден, пропускаем`);
          continue;
        }

        const goals = await getAllGoals(profile.id);
        const savingGoals = await getUserSavingGoals(profile.telegramId);

        // Формируем массив целей за последние 7 дней
        const arrayIdGoals = [];
        const targetDates = [];

        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          targetDates.push(date.toISOString().split('T')[0]);
        }

        const matchingGoals = savingGoals.savingGoals?.filter(item =>
          targetDates.includes(item.date)
        ) || [];

        matchingGoals.forEach(item => {
          for (let i = 0; i < item.goalData.length; i++) {
            const t = {
              idGoals: item.goalData[i].idGoals,
              status: item.goalData[i].status,
              date: item.date,
            };
            arrayIdGoals.push(t);
          }
        });

        const goalsArray = [];
        arrayIdGoals.forEach(goalItem => {
          const goal = goals.find(g => g.id == goalItem.idGoals);
          if (goal) {
            goalsArray.push({
              id: goal.id,
              title: goal.title,
              status: goalItem.status,
              date: goalItem.date,
            });
          }
        })

        await bot.telegram.sendMessage(
          userId,
          `👋 Привет, ${profile.firstName}!

Вот и воскресенье — неделя позади 🕊  
Самое время посмотреть, как ты продвинулся(лась).

📈 Я подготовил для тебя недельный отчёт!  
Листай ниже и не забудь похвалить себя 🤗`
        );

        // Генерируем отчет
        const text = await generateSavingGoalsReport(profile.telegramId, 7, goalsArray);

        if (!text || !text.success) {
          console.log(`Не удалось сгенерировать отчет для пользователя ${userId}`);
          continue;
        }

        // Отправляем текстовый отчет
        await bot.telegram.sendMessage(userId, text.reportText);
        console.log(`Текстовый отчет отправлен пользователю: ${userId}`);

        // Генерируем и отправляем график, если есть данные
        const chartData = text.reportData?.chartData;
        if (chartData && chartData.dates && chartData.goalsCompletion) {
          try {
            const width = 1200;
            const height = 500;
            const backgroundColour = 'white';

            const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

            const PALETTE = ['#2E86AB', '#F6C85F', '#7BC043', '#FF6F61', '#6A4C93', '#F67E7D'];

            function hexToRgba(hex, alpha = 1) {
              const h = hex.replace('#', '');
              const bigint = parseInt(h, 16);
              const r = (bigint >> 16) & 255;
              const g = (bigint >> 8) & 255;
              const b = bigint & 255;
              return `rgba(${r},${g},${b},${alpha})`;
            }

            const dates = chartData.dates;
            const goalsCompletion = chartData.goalsCompletion;
            const goalIds = Object.keys(goalsCompletion);
            const goalsCount = Math.max(goalIds.length, 1);

            const percentPerDate = dates.map((_, dayIndex) => {
              let done = 0;
              for (const goalId of goalIds) {
                const g = goalsCompletion[goalId];
                const v = g && g.completions && g.completions[dayIndex] ? 1 : 0;
                done += v;
              }
              return done / goalsCount;
            });

            const mainColor = PALETTE[0];

            const datasets = [{
              label: 'Процент выполнения целей',
              data: percentPerDate,
              borderColor: hexToRgba(mainColor, 1),
              backgroundColor: hexToRgba(mainColor, 0.12),
              fill: true,
              tension: 0.25,
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: percentPerDate.map(p => p >= 1 ? hexToRgba(mainColor, 1) : (p > 0 ? hexToRgba(mainColor, 0.9) : 'rgba(200,200,200,0.6)')),
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              cubicInterpolationMode: 'monotone'
            }];

            const config = {
              type: 'line',
              data: { labels: dates, datasets },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: { display: true, text: 'Выполнение целей по дням' },
                  legend: { display: true },
                  tooltip: {
                    callbacks: {
                      label: (tt) => `${tt.dataset.label}: ${Math.round(tt.parsed.y * 100)}%`
                    }
                  }
                },
                scales: {
                  y: {
                    min: 0, max: 1,
                    ticks: {
                      callback: (v) => `${Math.round(v * 100)}%`
                    }
                  }
                }
              }
            };

            const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);

            await bot.telegram.sendPhoto(userId, { source: imageBuffer }, {
              caption: 'График выполнения ваших целей'
            });

            console.log(`График отправлен пользователю: ${userId}`);

          } catch (chartError) {
            console.error(`Ошибка при генерации графика для пользователя ${userId}:`, chartError.message);
            // Продолжаем работу даже если график не сгенерировался
          }
        }

        // Небольшая пауза между отправками, чтобы не перегружать API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (userError) {
        console.error(`Ошибка при обработке пользователя ${userId}:`, userError.message);
        // Продолжаем обработку следующего пользователя
        continue;
      }
    }

    console.log('Все еженедельные отчеты отправлены');

  } catch (error) {
    console.error('Критическая ошибка в sendWeeklyReport:', error);
  }
}

async function sendDailyReminders(timeOfDay) {
  const reminderMessages = {
    morning: [
      `🌅 Доброе утро! Не забудь про свои цели на сегодня!\n\nПроверь, что планируешь сделать сегодня для достижения своих целей.`,
      `🌤 Утро началось! Время вспомнить о своих целях.\n\nСделай шаг к лучшей версии себя прямо сейчас!`,
      `☀️ Новый день — новые возможности! Не забудь поработать над своими целями сегодня.`
    ],
    evening: [
      `🌙 Вечер настал. Не забудь сгенерировать отчёт о проделанной работе!\n\nНажми /generate, чтобы поделиться своими достижениями.`,
      `🌇 День подходит к концу. Время подвести итоги и сгенерировать отчёт о своих целях!`,
      `🌆 Вечер — время отчёта! Поделись своими достижениями за день с помощью команды /generate`
    ]
  };

  const messages = reminderMessages[timeOfDay];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  const telegramUsers = await getAllUserIds();
  const mapTelegramId = telegramUsers.map(t => t.telegramId);

  for (const userId of mapTelegramId) {
    try {
      if (timeOfDay === 'morning') {

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const day = yesterday.toISOString().split('T')[0];

        const savingGoalsDay = await getUserSavingGoalsWithAutoPeriod(userId)

        const savingGoals = await getUserSavingGoals(userId)

        const TheLastNumber = savingGoals.savingGoals?.length - 1

        const TheLastDay = savingGoals?.savingGoals[TheLastNumber]

        if (day === TheLastDay) {
          const deleteSavingGoals = await clearAllSavingGoals(userId)

          await bot.telegram.sendMessage(userId, 'У вас нет целей возможно вы их не взяли или у них закончился срок выполнения❗️\n Нужно зайти в приложение и снова взять себе цели', {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
              ]
            }
          });

        }

        if (savingGoalsDay.savingGoals?.length !== 0) {
          let i = savingGoalsDay.savingGoals.length - 1
          if (savingGoalsDay.savingGoals[i].goalData.length === 0) {
            await bot.telegram.sendMessage(userId, 'У ваших целей истёк срок выполнения❗️\n Нужно зайти в приложение и снова взять себе цель', {
              reply_markup: {
                inline_keyboard: [
                  [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
                ]
              }
            });
          }
        }

      }
      await bot.telegram.sendMessage(userId, randomMessage, {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('📋 Мои цели', 'show_goals')],
            [Markup.button.callback('📊 Сгенерировать отчёт', 'generation')],
            [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
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












const BOT_TOKEN_ = process.env.BOT_TOKEN_;

const bot_ = new Telegraf(BOT_TOKEN_);

bot_.command('start', async (ctx) => {
  await ctx.replyWithMarkdown(
    `❓ *Часто задаваемые вопросы* ❓\n\n` +
    `Если у вас возникли какие-то вопросы по нашему приложению или боту, вы можете найти ответы здесь.\n\n` +

    `*Частые вопросы:*\n` +
    `/why - Зачем нужен бот Дневные достижения?\n` +
    `/newGoals - Как взять себе цели?\n` +
    `/accomplishment - Как выполнить или отменить выполнение цели?\n` +
    `/deleteGoals - Как удалить у себя цель?\n` +
    `/personalGoals - Как добавить свою личную цель?\n` +
    `/yesterday - Что делать если забыл отметить вчера цели?\n` +
    `/report - Откуда взять дневной/недельный/месяцный отчёт?\n` +
    `/achievements - Как получить ачивку?\n` +
    `/history - Как поделиться ачивкой?\n` +
    `/continuation - Что будет дальше с проектом?\n` +
    `/slowdowns - Что делать, если бот или приложение медленно работают?\n\n` +

    `Если вы не нашли ответ на свой вопрос напишите его в комментариях в нашем канале\n` +
    `Наш телеграмм канал: *@Motivation_bot_channel*`
  );
});


bot_.command('why', async (ctx) => {
  try {

    await ctx.replyWithMarkdown(
      `*🚀 Зачем нужен бот «Дневные достижения»?*

Дисциплина — это главная мышца успеха.  
Именно она отличает тех, кто *хочет*, от тех, кто *делает*.

*«Дневные достижения»* — это не просто трекер задач.  
Это инструмент, который помогает вам:
• формировать полезные привычки  
• доводить цели до конца  
• видеть реальный прогресс, а не иллюзию занятости  

---

✨ *Основные возможности бота:*
• 🎯 Ставьте цели на *30 / 60 / 120 дней*
• ✅ Отмечайте ежедневное выполнение
• 🏆 Получайте очки и уникальные достижения
• 📊 Анализируйте прогресс через отчёты
• ❄️ Участвуйте в *Winter Arc* — зимней программе развития

---

💡 *Главная цель «Дневных достижений»*  
Помочь вам **прокачать дисциплину** — ту самую внутреннюю силу,  
которая делает результат неизбежным.

Маленькие шаги каждый день → большие изменения в жизни 🌱  
Начните сегодня — и поблагодарите себя завтра.
`,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Закрыть', 'message_close')],
        ]).reply_markup
      });

  } catch (error) {
    console.error('Error sending newGoals photo:', error);
    await ctx.reply('❌ Произошла ошибка при загрузке изображения. Попробуйте позже.');
  }
});


bot_.command('newGoals', async (ctx) => {
  try {
    await ctx.replyWithVideo(
      'https://h.uguu.se/zvRunwAf.mp4',
      {
        caption:
          `*🎯 Как взять цель в приложении?*

Следуйте этим простым шагам 👇

1️⃣ Перейдите в раздел *«Цели»*  
2️⃣ Откройте вкладку *«Доступные»*  
3️⃣ Выберите цель, которую хотите выполнять  
4️⃣ Нажмите на неё — откроется окно  
5️⃣ Укажите на сколько хотите взять эту цель *(30 / 60 / 120 дней)*  
6️⃣ Нажмите кнопку *«Взять цель»*

✨ Готово!  
Цель появится в разделе *«В процессе»*, и вы сможете отмечать выполнение каждый день.

Маленькие действия сегодня → большие результаты завтра 🚀`,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Закрыть', 'message_close')],
        ]).reply_markup
      }
    );

  } catch (error) {
    console.error('Error sending newGoals video:', error);
    await ctx.reply('❌ Произошла ошибка при загрузке видео. Попробуйте позже.');
  }
});


bot_.command('accomplishment', async (ctx) => {
  try {
    await ctx.replyWithVideo(
      'https://files.catbox.moe/502ahm.mp4',
      {
        caption:
          `*✅ Как выполнить или отменить выполнение цели?*

Есть *два способа* выполнить цель 👇

🟢 *Способ 1 — в приложении прямо в списке целей*  
Нажмите на цель *один раз* и дождитесь загрузки.  
После выполнения рядом появится *зелёная галочка* ✅  

🔄 *Чтобы отменить выполнение* — нажмите на эту же цель *второй раз* и дождитесь загрузки.

📋 *Способ 2 —  в боте*  
1️⃣ Найдите в меню или введите самостоятельно команду **/goals**  
2️⃣ В сообщении выберите раздел **«В процессе»**  
3️⃣ Нажмите на нужные цели  
4️⃣ Нажмите кнопку **«Выполнить»**

💡 Этот способ удобен, если у вас много активных целей.`,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Закрыть', 'message_close')],
        ]).reply_markup
      }
    );

  } catch (error) {
    console.error('Error sending newGoals photo:', error);
    await ctx.reply('❌ Произошла ошибка при загрузке изображения. Попробуйте позже.');
  }
});


bot_.command('deleteGoals', async (ctx) => {
  await ctx.replyWithVideo(
    'https://files.catbox.moe/tfmzzo.mp4',
    {
      caption:
        `*🗑 Как удалить цель?*

Если цель больше не актуальна, вы можете удалить её в любой момент 👇

📌 *Пошагово:*  
1️⃣ Найдите цель, которую хотите удалить  
2️⃣ *Зажмите палец* на этой цели и подождите  
3️⃣ Внизу появится *красная кнопка* **«Удалить цель»**  
4️⃣ Нажмите на неё — цель будет удалена

⚠️ *Обратите внимание:* после удаления цели её снова можно будет найти в разделе *Доступные* и взять её а прогресс на ей сохранится.`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('personalGoals', async (ctx) => {
  await ctx.replyWithVideo(
    'https://files.catbox.moe/jyuuwr.mp4',
    {
      caption:
        `*➕ Как добавить свою личную цель?*

Вы можете создать собственную цель, которая будет только у вас 👇

📌 *Пошагово:*  
1️⃣ Перейдите в раздел с целями  
2️⃣ Вверху выберите вкладку **Доступные**  
3️⃣ В правом верхнем углу нажмите кнопку **➕**  
4️⃣ В открывшемся окне:
   • введите *название цели*  
   • выберите *категорию*, к которой она относится  
5️⃣ Нажмите **«Добавить»**

✅ Готово!  
Ваша цель появится в выбранной категории.

📍 *Что дальше?*  
Теперь возьмите её как обычную цель — через список целей или команду **/newGoals**.`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('yesterday', async (ctx) => {
  await ctx.replyWithVideo(
    'https://files.catbox.moe/i2qea0.mp4',
    {
      caption:
        `*⏪ Что делать, если вы забыли отметить цели вчера?*

Не переживайте — бот позволяет откатиться на предыдущий день 👇

📌 *Как это сделать:*  
1️⃣ На главном экране внизу найдите слово **«Откат»** рядом будет кнопка **<**
2️⃣ Нажмите на неё — откроется страница *вчерашних целей*  
3️⃣ Выберите нужные цели и:
   • выполните их ✅  
   • или отмените выполнение ❌  

📊 *Отчёт за вчера*  
Внизу списка вчерашних целей есть кнопка **«Сгенерировать отчёт»**.  
Нажмите её — и бот создаст для вас подробный отчёт за прошлый день.

💡 Используйте откат, чтобы сохранять честную статистику и не терять прогресс.`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('report', async (ctx) => {
  await ctx.replyWithVideo(
    'https://files.catbox.moe/zre82m.mov',
    {
      caption:
        `*📊 Откуда взять дневной/недельный/месяцный отчёт??*

Бот автоматически помогает отслеживать ваши достижения на разных промежутках времени 👇

🗓 *Дневной отчёт*  
На главном экране есть кнопка **«Сгенерировать отчёт»**.  
Нажмите на неё — бот создаст отчёт по *сегодняшним целям*.  
Вы можете **скопировать текст** и отправить его куда угодно.

📅 *Недельный отчёт*  
Недельный отчёт **приходит автоматически**.  
Бот присылает его **каждое воскресенье в 10:00** ⏰  
В нём — ваш прогресс за всю неделю.

🗓 *Месячный отчёт*  
🚧 В разработке. Скоро станет доступен!

💡 Отчёты помогают видеть реальный прогресс и сохранять мотивацию.`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('achievements', async (ctx) => {

  await ctx.replyWithVideo(
    'https://files.catbox.moe/9smom0.mp4',
    {
      caption:
        `*🎖 Как получить ачивку?*\n\n` +
        `1. Выберите ачивку, которую хотите получить.\n` +
        `2. Нажмите на неё — вы увидите её анимацию.\n` +
        `3. Под анимацией будет написано, что нужно сделать, чтобы получить эту ачивку.\n\n` +
        `*⚠ Важно!* Эпические ачивки доступны только в определённый период. После его окончания получить их будет невозможно!\n` +
        `Чтобы не пропустить эпические ачивки, следите за нашими новостями в канале *@Motivation_bot_channel*`
      ,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('history', async (ctx) => {

  await ctx.replyWithVideo(
    'https://files.catbox.moe/m2hfd6.mp4',
    {
      caption:
        `*🎖 Как поделиться ачивкой (историей)*\n\n` +
        `1. Выберите ачивку, которую хотите опубликовать. Обратите внимание: делиться можно только ачивками, которые у вас уже есть.\n` +
        `2. Нажмите на неё — вы увидите её анимацию.\n` +
        `3. Под анимацией появится кнопка *Поделиться / История*. Дождитесь, пока ачивка загрузится, и затем сможете опубликовать её в истории.\n\n` +
        `*⚠ Важно!* Делиться можно только теми ачивками, которые вы действительно имеете.`
      ,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('continuation', async (ctx) => {
  await ctx.replyWithMarkdown(
    `*🚀 Что будет дальше с проектом?*\n\n` +
    `Наши разработчики внимательно прислушиваются к вашим пожеланиям и идеям. У нас уже есть множество классных планов по развитию, и многое зависит от вашей поддержки! 🎯\n\n` +
    `Теперь регулярно будут появляться новые ачивки разных редкостей, так что впереди много интересного! 🏅\n\n` +
    `Наш продукт пока полностью бесплатный, но для дальнейшего развития и расширения проекта нам нужна поддержка. Мы будем очень благодарны за любую помощь — вместе мы сможем сделать проект ещё лучше! ❤️`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('💖 Поддержать проект', 'support')],
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('slowdowns', async (ctx) => {

  await ctx.replyWithMarkdown(
    `*🐢 Что делать, если бот или приложение работают медленно?*\n\n` +
    `Если вы заметили задержки или подвисания, попробуйте следующие шаги:\n` +
    `1. Перезапустите бота или приложение.\n` +
    `2. Проверьте VPN — возможно, он включён и замедляет соединение.\n` +
    `3. Убедитесь, что интернет-соединение стабильно.\n\n` +
    `Если это не помогает, подождите немного ⏳. Иногда бот или приложение перегружены из-за большого количества пользователей, и немного времени достаточно, чтобы всё снова работало быстро.`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.action('message_close', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {
    console.error('message_close error:', e.message);
  }
});

bot_.command('support', async (ctx) => {
  try {
    await ctx.replyWithPhoto(
      { source: './Img/qr.jpg' },
      {
        caption:
          `💚 *Поддержка проекта*\n\n` +
          `Если вам нравится бот и приложение — вы можете поддержать развитие проекта.\n\n` +
          `Спасибо, что вы с нами. ❄️`,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('💸 Поддержать проект', 'https://www.tinkoff.ru/rm/r_adpKgpwYuC.VvrLvQmxSb/GjWkK97277')],
          [Markup.button.callback('❌ Закрыть', 'message_close')],
        ]).reply_markup
      }
    );
  } catch (error) {
    console.error('Error sending support photo:', error);
    await ctx.reply('❌ Произошла ошибка при загрузке изображения. Попробуйте позже.');
  }
});

bot_.launch();

process.once('SIGINT', () => bot_.stop('SIGINT'));
process.once('SIGTERM', () => bot_.stop('SIGTERM'));

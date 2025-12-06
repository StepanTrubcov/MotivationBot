import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { getUserData, generateSavingGoalsReport, getAllGoals, getUserSavingGoals, clearAllSavingGoals, getUserSavingGoalsWithAutoPeriod, removeSavingGoalFromToday, removePoints, deleteCompletedDate, updateSavingGoalStatus, addProfile, initializeUserGoals, checkGoalCompletion, getAllStatus, addPoints, addCompletedDate, getGeneraleText } from './Api/Api.js';
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
const notifiedUsers = new Set();

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
    Маленькие шаги, сделанные стабильно — это и есть путь к реальным результатам.\n\n` +
    `Если у вас возникли какие-то вопросы, вы можете найти на них ответ в этом боте @keep\\_alive\\_Assistant\\_bot или же вы можете написать в группу с разработчиком`,
    Markup.inlineKeyboard([
      [Markup.button.url('✉️ Группа с разработчиком', 'https://t.me/+b-7H62ruiww0ODdi')],
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
        `⚡ *Готово!*  
      Сообщение собрано — это твой сегодняшний отчёт.  
      Скопируй или пересылай его в канал, группу или друзьям.  
      Пусть видят, что ты *в игре*. 🧊🔥`,
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
          console.log('464')
          addPoints(uid, g.points)
          console.log('466')
          addCompletedDate(telegramId, until)
          console.log('468')

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

bot.command('news_channel', async (ctx) => {
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
  for (const userId of activeUsers) {
    try {
      //userId
      const profile = await getUserData(userId)

      const goals = await getAllGoals(profile.id);

      const savingGoals = await getUserSavingGoals(profile.telegramId)


      const arrayIdGoals = [];

      const targetDates = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        targetDates.push(date.toISOString().split('T')[0]);
      }

      const matchingGoals = savingGoals.savingGoals.filter(item =>
        targetDates.includes(item.date)
      );


      matchingGoals.forEach(item => {
        for (let i = 0; i < item.goalData.length; i++) {

          const t = {
            idGoals: item.goalData[i].idGoals,
            status: item.goalData[i].status,
            date: item.date,
          }
          arrayIdGoals.push(t)
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
      });

      const text = await generateSavingGoalsReport(profile.telegramId, 7, goalsArray);
      console.log(text)
      const chartData = text.reportData?.chartData;
      const labels = chartData.dates;
      const goalsCompletion = chartData.goalsCompletion;

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

        const dates = labels;
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

        await bot.telegram.sendMessage(userId, text.reportText);

        await bot.telegram.sendPhoto(userId, { source: imageBuffer }, {
          caption: 'График выполнения ваших целей'
        });

      } catch (error) {
        console.error('Ошибка при генерации графика:', error);
        await bot.telegram.sendMessage(userId, text.reportText);
      }


    } catch (e) {
      console.log('Ошибка при запросе за большим недельным отчётом:', e)
    }

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

  for (const userId of activeUsers) {
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
                [Markup.button.webApp('🚀 Открыть приложение', WEB_APP_URL)]
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
                  [Markup.button.webApp('🚀 Открыть приложение', WEB_APP_URL)]
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













const BOT_TOKEN_ = process.env.BOT_TOKEN_;

const bot_ = new Telegraf(BOT_TOKEN_);

bot_.command('start', async (ctx) => {
  await ctx.replyWithMarkdown(
    `❓ *Часто задаваемые вопросы* ❓\n\n` +
    `Если у вас возникли какие-то вопросы по нашему приложению или боту, вы можете найти ответы здесь.\n\n` +

    `*Частые вопросы:*\n` +
    `/newGoals - Как взять себе цели?\n` +
    `/deleteGoals - Как удалить у себя цели?\n\n` +
    `/slowdowns - Что делать, если бот или приложение медленно работают?\n` +
    `/personalGoals - Как добавить свою личную цель?\n` +
    `/achievements - Как получить достижение?\n` +
    `/quantity - Сколько целей можно себе брать?\n` +
    `/continuation - Что будет дальше с проектом?\n\n` +

    `Наш телеграмм канал:\n @Motivation_bot_channel`
  );
});

bot_.command('newGoals', async (ctx) => {
  try {
    await ctx.replyWithPhoto(
      'https://i.postimg.cc/3w5R3Lq5/Snimok-ekrana-2025-11-04-v-16-56-03.png',
      {
        caption:
          `*Как взять себе цели?*\n\n` +
          `Чтобы взять себе цели, нужно зайти в раздел "Доступные цели". Там среди разных категорий нужно выбрать цель, которую хотите, и нажать на неё. Откроется окно, в котором нужно будет нажать на кнопку "Взять цель на 30 дней". Всё готово! Теперь эта цель переместится в раздел "В процессе".`,
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
  await ctx.replyWithMarkdown(
    `*Как удалить у себя цели?*\n\n` +
    `Извините, но пока цели нельзя удалять, но наши разработчики уже работают над этим.`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );
});

bot_.command('slowdowns', async (ctx) => {

  await ctx.replyWithMarkdown(
    `*Что делать, если бот или приложение медленно работают?*\n\n` +
    `Если такое произошло, то попробуйте следующие варианты: \n` +
    `1. Перезагрузить бота или приложение. \n` +
    `2. Перезагрузить устройство. \n` +
    `3. Проверить интернет-соединение. \n` +
    `4. Проверить ВПН, возможно, вы забыли его выключить.\n\n` +
    `Если ничего из этого не помогло, то попробуйте подождать. Возможно, ботом или приложением пользуется слишком много пользователей, и нужно подождать.`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );
});

bot_.command('personalGoals', async (ctx) => {

  try {
    await ctx.replyWithPhoto(
      'https://i.postimg.cc/QC1DYsXx/Snimok-ekrana-2025-11-04-v-17-47-58.png',
      {
        caption:
          `*Как добавить свою личную цель?*\n\n` +
          `Чтобы добавить себе свою цель, нужно зайти в раздел "Доступные цели". Там справа от надписи "Цели" вы увидите зелёный круг с плюсиком, нужно нажать на него. Откроется окно, в котором нужно будет написать название цели, выбрать категорию цели и нажать на кнопку "Добавить цель". Всё готово! Теперь вы можете взять свою личную цель на 30 дней.`,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Закрыть', 'message_close')],
        ]).reply_markup
      }
    );
  } catch (error) {
    console.error('Error sending personalGoals photo:', error);
    await ctx.reply('❌ Произошла ошибка при загрузке изображения. Попробуйте позже.');
  }
});

bot_.action('message_close', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {
    console.error('message_close error:', e.message);
  }
});

bot_.command('achievements', async (ctx) => {

  await ctx.replyWithMarkdown(
    `*Как получить достижение?*\n\n` +
    `Чтобы получить достижение, нужно выполнить определённое количество раз соответствующую цель.\n\n` +
    `*Достижения и цели:*\n` +
    `1. 90 дней бега - нужно выполнить цель "Пробежать 1 км" 90 раз\n` +
    `2. Пятёрка выносливости - нужно выполнить цель "Пробежать 5 км" 60 раз\n` +
    `3. Здоровый рацион - нужно выполнить цель "Провести день без сладкого" 60 раз\n` +
    `4. Ледяная закалка - нужно выполнить цель "Облиться холодной водой" 60 раз\n` +
    `5. Кодерский марафон - нужно выполнить цель "Кодить 1 час за ноутбуком" 60 раз\n` +
    `6. Сила отжиманий - нужно выполнить цель "Сделать 20 отжиманий" 60 раз\n` +
    `6. Книжный марафон - нужно выполнить цель "Читать книгу 20 минут" 60 раз\n` +
    `7. Ранний старт - нужно выполнить цель "Рано проснуться" 60 раз`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );
});

bot_.command('quantity', async (ctx) => {
  await ctx.replyWithMarkdown(
    `*Сколько целей можно себе брать?*\n\n` +
    `Можно брать столько целей, сколько хотите, главное — успевайте их выполнять!`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );
});

bot_.command('continuation', async (ctx) => {
  await ctx.replyWithMarkdown(
    `*Что будет дальше с проектом?*\n\n` +
    `Наши разработчики будут прислушиваться к вашим пожеланиям и предложениям. Уже есть много классных идей для продвижения, так что всё зависит от вас и вашей поддержки! Наш продукт пока что бесплатный, а для продолжения и расширения проекта нужны большие средства, поэтому мы будем очень рады, если вы нас поддержите!`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Поддержать проект', 'support')],
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );
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

















const BOT_TOKEN_BOT = process.env.BOT_TOKEN_BOT;

const bot_bot = new Telegraf(BOT_TOKEN_BOT);

bot_bot.start(async (ctx) => {
  await ctx.reply(
    `👋 ${ctx.from.first_name} привет!\n\n` +
    `Сейчас бот на техническом обслуживании!\n\n` +
    `Разработчик запускает новое, крутое обновление\n` +
    `У нас появился телеграмм канал!!! Переходи туда чтобы быть вкурсе всех обновлений @Motivation_bot_channel `,
  )
});

bot_bot.command('goals', async (ctx) => {
  await ctx.reply(
    `👋 ${ctx.from.first_name} привет!\n\n` +
    `Сейчас бот на техническом обслуживании!\n\n` +
    `Разработчик запускает новое, крутое обновление\n` +
    `У нас появился телеграмм канал!!! Переходи туда чтобы быть вкурсе всех обновлений @Motivation_bot_channel `,
  )
});

bot_bot.launch();

process.once('SIGINT', () => bot_.stop('SIGINT'));
process.once('SIGTERM', () => bot_.stop('SIGTERM'));
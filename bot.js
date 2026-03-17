import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { getAllUserIds, getUserData, generateSavingGoalsReport, getAllGoals, getUserSavingGoals, clearAllSavingGoals, getUserSavingGoalsWithAutoPeriod, updateSavingGoalStatus, addProfile, initializeUserGoals, checkGoalCompletion, getAllStatus, addPoints, getGeneraleText } from './Api/Api.js';
import cron from 'node-cron';
import sharp from 'sharp';
import path from 'path';

const FONT_DIR = path.join(process.cwd(), 'fonts');
process.env.FONTCONFIG_PATH = FONT_DIR;
process.env.FONTCONFIG_FILE = path.join(FONT_DIR, 'fonts.conf');

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = '';

async function svgToPngBuffer(svgString) {
  return sharp(Buffer.from(svgString))
    .png({ quality: 90 })
    .toBuffer();
}

function computeSeries(timeGoalsSaving) {
  if (!timeGoalsSaving || !Array.isArray(timeGoalsSaving)) return 0;

  const today = new Date().toISOString().split("T")[0];
  const pastDays = timeGoalsSaving
    .filter((item) => item.date < today)
    .sort((a, b) => a.date.localeCompare(b.date));

  let num = 0;
  pastDays.forEach((s) => {
    const r = (s.goalData || []).filter((g) => g.status === "completed");
    if (r.length >= 1) num += 1;
    else num = 0;
  });

  const todayDay = timeGoalsSaving.find((item) => item.date === today);
  if (todayDay && todayDay.goalData) {
    const r = todayDay.goalData.filter((g) => g.status === "completed");
    if (r.length > 0) num += 1;
  }

  return num;
}

function getIsTodayCompleted(timeGoalsSaving) {
  if (!timeGoalsSaving || !Array.isArray(timeGoalsSaving)) return false;

  const today = new Date().toISOString().split("T")[0];
  const todayDay = timeGoalsSaving.find((item) => item.date === today);
  if (!todayDay || !todayDay.goalData) return false;
  return todayDay.goalData.some((g) => g.status === "completed");
}

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required in .env');
}

let userIdApi = null;
let goalsApi = null;
let userData = null
let reportReminders = null
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
      `👋 Привет, ${ctx.from.first_name}!\n\n` +

      `Этот бот поможет тебе:\n` +
      `✅ выработать дисциплину\n` +
      `✅ закрепить полезные привычки\n` +
      `✅ увидеть свой реальный прогресс\n\n` +

      `📌 *Как это работает:*\n` +
      `1️⃣ Выбираешь цели (спорт, дисциплина и др.)\n` +
      `2️⃣ Каждый день отмечаешь выполнение\n` +
      `3️⃣ Бот присылает напоминания\n` +
      `4️⃣ Ты получаешь очки, ачивки и отчёты\n` +
      `5️⃣ Видишь свой прогресс в календаре\n\n` +

      `⏱ Занимает всего 1–3 минуты в день.\n\n` +

      `📢 Наш канал: *@Motivation_bot_channel*\n` +
      `❓ Вопросы и помощь: *@keep_alive_Assistant_bot*\n\n` +

      `🚀 *Начни прямо сейчас - пройди обучение*`,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('🚀 Пройти обучение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
        ]).reply_markup
      }
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

      return ctx.replyWithMarkdown(
        `📋 *Твои цели*\n\n` +
        `Здесь собраны все цели, над которыми ты работаешь.\n\n` +
        `🟡 *В процессе* — цели, которые тебе нужно выполнить\n` +
        `✅ *Выполненные* — цели, которые уже выполнены\n\n` +
        `Выбери, что хочешь посмотреть:`,
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

bot.command('mini_aps', async (ctx) => {
  await ctx.replyWithMarkdown(
    `⚔️ Мини-приложение *Дневные достижения*\n\n`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Открыть приложение', `https://motivation-oz64-mjsetxg5f-stepans-projects-e54d3120.vercel.app/`)],
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.command('info', async (ctx) => {
  await ctx.replyWithMarkdown(
    `ℹ️ *О проекте «Дневные достижения»*\n\n` +
    `Этот бот и мини-приложение помогают:\n` +
    `🎯 формировать полезные привычки\n` +
    `💪 развивать дисциплину\n` +
    `📈 видеть реальный прогресс\n\n` +

    `📌 *Как пользоваться:*\n` +
    `1️⃣ Открой мини-приложение через кнопку «🚀 Открыть приложение»\n` +
    `2️⃣ Выбери цели на 30, 60 или 120 дней\n` +
    `3️⃣ Каждый день отмечай выполнение\n` +
    `4️⃣ Получай очки, достижения и отчёты\n\n` +

    `📊 *Отчёты*\n` +
    `• ежедневные — вручную\n` +
    `• еженедельные и месячные — автоматически\n` +
    `• с графиками и статистикой\n\n` +

    `❄️ *Winter Arc* — это сезонный режим,\n` +
    `который помогает пройти зиму осознанно,\n` +
    `не теряя темп и дисциплину.\n\n` +

    `🧭 Используй бота каждый день.\n` +
    `Даже маленькие действия, сделанные регулярно,\n` +
    `дают сильный результат.\n\n` +
    `❓ Вопросы и помощь: *@keep_alive_Assistant_bot*\n` +
    `📢 Канал проекта: *@Motivation_bot_channel*`,
    Markup.inlineKeyboard([
      [Markup.button.callback('❌ Закрыть', 'close_message')],
    ])
  );
});

bot.command('generate', async (ctx) => {
  const loading = await ctx.reply('⏳ Генерируем твой отчёт...');
  try {
    const profile = await addProfile(ctx);
    const uid = profile?.id;
    userData = profile
    const userTag = profile?.usersTag
    if (uid) {
      const goalsTime = await checkGoalCompletion(uid);
      const goals = await initializeUserGoals(uid);
      const timeGoalsSaving = await getUserSavingGoals(ctx.from.id);

      goalsApi = goalsTime || goals;

      const goalsInProgress = goalsApi.filter(g => g.status === 'in_progress');
      const goalsDone = goalsApi.filter(g => g.status === 'completed');

      if (goalsInProgress.length === 0 && goalsDone.length === 0) {
        await ctx.deleteMessage(loading.message_id);
        return ctx.reply('😴 Пока ничего нет — пора действовать. Возьми цели и начни движение.');
      }

      const series = computeSeries(timeGoalsSaving?.savingGoals);
      const isTodayCompleted = getIsTodayCompleted(timeGoalsSaving?.savingGoals);

      const levelsOfLights = [
        { url: "5192859097178873603", daysMin: 2, daysMax: 4 },
        { url: "5224536851808815753", daysMin: 5, daysMax: 8 },
        { url: "5226521156764340272", daysMin: 9, daysMax: 12 },
        { url: "5224528579701806800", daysMin: 13, daysMax: 16 },
        { url: "5224530920458980477", daysMin: 17, daysMax: 22 },
        { url: "5224196071923683270", daysMin: 23, daysMax: 30 },
        { url: "5224673749596411018", daysMin: 31, daysMax: 45 },
        { url: "5224203158619722114", daysMin: 46, daysMax: 60 },
        { url: "5224343728604352036", daysMin: 61, daysMax: 89 },
        { url: "5224479788873323449", daysMin: 90, daysMax: 120 },
      ];
      const grayLightUrl = '5224728012213228232';

      const currentLight = levelsOfLights.find(
        (level) => series >= level.daysMin && series <= level.daysMax
      ) || levelsOfLights[levelsOfLights.length - 1];
      const lightUrl = isTodayCompleted ? currentLight.url : grayLightUrl;

      const generateText = await getGeneraleText(series, userTag, userData.telegramId, goalsDone, goalsInProgress);

      await ctx.deleteMessage(loading.message_id);

      const emojiPlaceholder = '🔥';
      const fireIndex = generateText.indexOf(emojiPlaceholder);
      const entities = fireIndex !== -1
        ? [{ offset: fireIndex, length: emojiPlaceholder.length, type: 'custom_emoji', custom_emoji_id: lightUrl }]
        : undefined;

      await ctx.reply(generateText, entities ? { entities } : {});
    }
  } catch (err) {
    console.error('Ошибка генерации:', err);
    await ctx.deleteMessage(loading.message_id);
    await ctx.reply('❌ Что-то пошло не так при генерации сообщения. Попробуй снова.');
  }
});

bot.action('Done_goals_generation', async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  const messageInfo = selectedByMessage.get(msgId) || { selected: new Set(), type: null };
  const selected = messageInfo.selected;

  if (selected.size !== 0) {

    const chosen = (goalsApi || []).filter(g => selected.has(g.id));

    const loading = await ctx.reply('⏳ Обновляем цели...');

    const until = new Date().toISOString().split('T')[0];

    try {
      // Выполняем операции последовательно
      for (const g of chosen) {
        try {
          const profile = await addProfile(ctx);
          const uid = profile?.id;
          const telegramId = profile?.telegramId
          if (uid) {
            getAllStatus(uid, g.id, 'done')
            addPoints(uid, g.points)

            try {
              await updateSavingGoalStatus(telegramId, until, g.id, "completed")
              console.log('Цель обновлена успешно:', g.id)
            } catch (updateError) {
              console.error('Ошибка при обновлении статуса цели:', g.id, updateError)
            }
          }
        } catch (e) {
          console.error('Ошибка при обработке цели:', g.id, e)
        }
      }

      await ctx.deleteMessage(loading.message_id);
    } catch (e) {
      console.error('Done_goals_generation error:', e.message);
      await ctx.reply('❌ Ошибка при обновлении целей, попробуй ещё раз.');
    } finally {
      selectedByMessage.delete(msgId);
    }
  }

  try {

    const loading = await ctx.reply('⏳ Генерируем твой отчёт...');

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

      await ctx.deleteMessage(loading.message_id)

      await ctx.reply(generateText);
    }

  } catch (e) {
    console.error('Done_goals_generation error:', e.message);
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

      return ctx.replyWithMarkdown(
        `📋 *Твои цели*\n\n` +
        `Здесь собраны все цели, над которыми ты работаешь.\n\n` +
        `🟡 *В процессе* — цели, которые тебе нужно выполнить\n` +
        `✅ *Выполненные* — цели, которые уже выполнены\n\n` +
        `Выбери, что хочешь посмотреть:`,
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

function buildInProgressKeyboard(inProgress, selectedSet, messageType = null, goals, userId) {
  const maxLen = Math.max(...inProgress.map(g => g.title.length));

  console.log(goals, '392')

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

  // Проверяем тип сообщения
  if (messageType === 'reminder') {
    rows.push([Markup.button.callback('📊 Сгенерировать отчёт', 'Done_goals_generation')]);
  } else {
    rows.push([Markup.button.callback('✅ Выполнить', 'Done_goals')]);
  }

  rows.push([Markup.button.callback('❌ Закрыть', 'close_message')]);

  return Markup.inlineKeyboard(rows, { columns: 1 });
}

bot.action(/^toggle_goal_(.+)$/, async (ctx) => {
  const goalId = ctx.match[1];
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  await ctx.answerCbQuery();

  if (!msgId) return;

  // Получаем информацию о сообщении
  const messageInfo = selectedByMessage.get(msgId) || { selected: new Set(), type: null };

  // Определяем тип сообщения, если еще не установлен
  if (!messageInfo.type) {
    const isReminder = msg.text && msg.text.includes('Сгенерировать отчёт');
    messageInfo.type = isReminder ? 'reminder' : 'regular';
  }

  // Обновляем выбор
  messageInfo.selected.has(goalId) ? messageInfo.selected.delete(goalId) : messageInfo.selected.add(goalId);
  selectedByMessage.set(msgId, messageInfo);

  const inProgress = (goalsApi || []).filter(g => g.status === 'in_progress');

  try {
    await ctx.editMessageReplyMarkup(
      buildInProgressKeyboard(inProgress, messageInfo.selected, messageInfo.type).reply_markup
    );
  } catch (e) {
    console.error('editMessageReplyMarkup error:', e.message);
  }
});

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

      const sent = await ctx.replyWithMarkdown(text, buildInProgressKeyboard(inProgress, new Set(), 'regular'));

      selectedByMessage.set(sent.message_id, { selected: new Set(), type: 'regular' });
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Ошибка при загрузке целей.');
  }
});

bot.action('Done_goals', async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  const messageInfo = selectedByMessage.get(msgId) || { selected: new Set(), type: null };
  const selected = messageInfo.selected;

  if (selected.size === 0) {
    return ctx.answerCbQuery('⚠️ Нет выбранных целей!', { show_alert: true });
  }

  const chosen = (goalsApi || []).filter(g => selected.has(g.id));

  const loading = await ctx.reply('⏳ Обновляем цели...');

  const until = new Date().toISOString().split('T')[0];

  try {
    for (const g of chosen) {
      try {
        const profile = await addProfile(ctx);
        const uid = profile?.id;
        const telegramId = profile?.telegramId
        if (uid) {
          getAllStatus(uid, g.id, 'done')
          addPoints(uid, g.points)

          try {
            await updateSavingGoalStatus(telegramId, until, g.id, "completed")
            console.log('Цель обновлена успешно:', g.id)
          } catch (updateError) {
            console.error('Ошибка при обновлении статуса цели:', g.id, updateError)
          }
        }
      } catch (e) {
        console.error('Ошибка при обработке цели:', g.id, e)
      }
    }

    const timeGoalsSaving = await getUserSavingGoals(ctx.from.id)

    const levelsOfLights = [
      { url: "5192859097178873603", daysMin: 2, daysMax: 4 },
      { url: "5224536851808815753", daysMin: 5, daysMax: 8 },
      { url: "5226521156764340272", daysMin: 9, daysMax: 12 },
      { url: "5224528579701806800", daysMin: 13, daysMax: 16 },
      { url: "5224530920458980477", daysMin: 17, daysMax: 22 },
      { url: "5224196071923683270", daysMin: 23, daysMax: 30 },
      { url: "5224673749596411018", daysMin: 31, daysMax: 45 },
      { url: "5224203158619722114", daysMin: 46, daysMax: 60 },
      { url: "5224343728604352036", daysMin: 61, daysMax: 89 },
      { url: "5224479788873323449", daysMin: 90, daysMax: 120 },
    ];

    const grayLightUrl = '5224728012213228232'

    const num = computeSeries(timeGoalsSaving?.savingGoals);
    const isTodayCompleted = getIsTodayCompleted(timeGoalsSaving?.savingGoals);

    const currentLight =
      levelsOfLights.find(
        (level) => num >= level.daysMin && num <= level.daysMax
      ) || levelsOfLights[levelsOfLights.length - 1];

    const finalUrl = isTodayCompleted
      ? currentLight.url
      : grayLightUrl;

    await ctx.deleteMessage(loading.message_id);
    let resultText = `✅ Успешно выполнено!`;
    let entities = undefined;

    if (num >= 2) {

      const emojiPlaceholder = '🔥';

      if (num === 2) {
        resultText = `Серия начата: ${emojiPlaceholder} ${num} дн.\n\n✅ Успешно выполнено!`;
      } else {
        resultText = `${emojiPlaceholder} Серия: ${num} дн.\n\n✅ Успешно выполнено!`;
      }

      // находим позицию 🔥
      const fireIndex = resultText.indexOf(emojiPlaceholder);

      entities = [
        {
          offset: fireIndex,
          length: emojiPlaceholder.length,
          type: 'custom_emoji',
          custom_emoji_id: finalUrl
        }
      ];
    }

    await ctx.editMessageText(resultText, { entities: entities, reply_markup: { inline_keyboard: [] } });
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
  // sendWeeklyReport()
  sendDailyReminders('evening')
});

bot.launch();
console.log('Бот запущен ✅');

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;

  // Утренние напоминания в 7:00
  cron.schedule('0 7 * * *', () => {
    sendDailyReminders('morning');
  }, {
    timezone: 'Europe/Moscow'
  });

  // Вечерние напоминания в 21:00
  cron.schedule('0 21 * * *', () => {
    sendDailyReminders('evening');
  }, {
    timezone: 'Europe/Moscow'
  });


  // каждое воскресенье в 20:00
  cron.schedule('0 20 * * 0', () => {
    sendWeeklyReport();
  }, {
    timezone: 'Europe/Moscow'
  });

  console.log('Ежедневные напоминания запланированы на 7:00 и 21:00 по Московскому времени');
});

console.log('FONTCONFIG_PATH:', process.env.FONTCONFIG_PATH);
console.log('FONTCONFIG_FILE:', process.env.FONTCONFIG_FILE);


function generateWeeklySVG({ dates, percents }) {
  const width = 700;
  const height = 280;
  const padding = 50;

  const maxY = 100;
  const stepX = (width - padding * 2) / Math.max(dates.length - 1, 1);
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = dates.findIndex(d => d === today);

  const points = percents.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (p / maxY) * (height - padding * 2);

    let color = '#F44336';
    if (p >= 70) color = '#4CAF50';
    else if (p >= 30) color = '#FFC107';
    if (i === todayIndex) color = '#2E86AB';

    return { x, y, p, color };
  });

  const avg = Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);
  const avgY = height - padding - (avg / maxY) * (height - padding * 2);
  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<style>
text {
  font-family: "DejaVu Sans", sans-serif;
  fill: #444;
  font-size: 12px;
}

.avg-line {
  stroke: #FF5722;
  stroke-width: 2;
  stroke-dasharray: 6,6;
}
</style>

<rect width="100%" height="100%" fill="#fff"/>

<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ddd"/>
<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ddd"/>

<text x="${padding - 6}" y="${height - padding}">0%</text>
<text x="${padding - 6}" y="${padding}">100%</text>

<polyline points="${linePoints}" fill="none" stroke="#2E86AB" stroke-width="3"/>

<line x1="${padding}" y1="${avgY}" x2="${width - padding}" y2="${avgY}" class="avg-line"/>
<text x="${width - padding + 6}" y="${avgY}">${avg}% среднее</text>

${points.map(p => `
<circle cx="${p.x}" cy="${p.y}" r="5" fill="${p.color}"/>
<text x="${p.x}" y="${p.y - 10}" text-anchor="middle">${p.p}%</text>
`).join('')}

${dates.map((d, i) => `
<text x="${padding + i * stepX}" y="${height - 10}" text-anchor="middle">
${d.slice(5)}${i === todayIndex ? ' (Сегодня)' : ''}
</text>
`).join('')}
</svg>`;
}

async function sendWeeklyReport() {
  try {
    const telegramUsers = await getAllUserIds();
    const mapTelegramId = telegramUsers.map(t => t.telegramId)

    console.log(`Найдено ${mapTelegramId.length} пользователей`);

    for (const userId of mapTelegramId) {
      console.log(userId)
      try {
        const profile = await getUserData(userId);
        if (!profile?.id) continue;

        const goals = await getAllGoals(profile.id);
        const savingGoals = await getUserSavingGoals(profile.telegramId);

        const targetDates = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          targetDates.push(d.toISOString().split('T')[0]);
        }

        const flatGoals = [];
        savingGoals.savingGoals?.forEach(day => {
          if (!targetDates.includes(day.date)) return;
          day.goalData.forEach(g => {
            flatGoals.push({
              idGoals: g.idGoals,
              status: g.status,
              date: day.date
            });
          });
        });

        const goalsArray = flatGoals
          .map(g => {
            const goal = goals.find(x => x.id == g.idGoals);
            if (!goal) return null;
            return {
              id: goal.id,
              title: goal.title,
              status: g.status,
              date: g.date
            };
          })
          .filter(Boolean);

        await bot.telegram.sendMessage(
          userId,
          `👋 Привет, ${profile.firstName}!\n\n` +
          `Неделя подошла к концу — самое время подвести итоги 🕊\n` +
          `Я подготовил для тебя отчёт 👇`
        );

        const report = await generateSavingGoalsReport(
          profile.telegramId,
          7,
          goalsArray
        );

        if (!report?.success) continue;

        await bot.telegram.sendMessage(userId, report.reportText);

        const chartData = report.reportData?.chartData;
        if (!chartData?.dates || !chartData?.goalsCompletion) continue;

        const dates = chartData.dates;
        const goalIds = Object.keys(chartData.goalsCompletion);
        const goalsCount = Math.max(goalIds.length, 1);

        const percents = dates.map((_, i) => {
          let done = 0;
          for (const g of goalIds) {
            if (chartData.goalsCompletion[g]?.completions?.[i]) done++;
          }
          return Math.round((done / goalsCount) * 100);
        });

        const avg = Math.round(
          percents.reduce((a, b) => a + b, 0) / percents.length
        );

        let summary;
        if (avg >= 70) summary = '🔥 Отличная неделя. Ты в сильном ритме.';
        else if (avg >= 40) summary = '💪 Неплохо. Есть хороший потенциал роста.';
        else summary = '⚠️ Было непросто. Главное — не останавливаться.';


        const svg = generateWeeklySVG({ dates, percents });
        const pngBuffer = await svgToPngBuffer(svg);

        await bot.telegram.sendPhoto(
          userId,
          { source: pngBuffer },
          {
            caption: '📈 Прогресс выполнения целей за неделю'
          }
        );


        await new Promise(r => setTimeout(r, 1000));

      } catch (e) {
        console.error(`Ошибка пользователя ${userId}:`, e.message);
      }
    }

    console.log('Еженедельные отчёты отправлены');

  } catch (e) {
    console.error('Критическая ошибка sendWeeklyReport:', e);
  }
}

async function sendDailyReminders(timeOfDay) {

  const telegramUsers = await getAllUserIds();

  for (const userId of telegramUsers) {
    try {

      const levelsOfLights = [
        { url: "5192859097178873603", daysMin: 2, daysMax: 4 },
        { url: "5224536851808815753", daysMin: 5, daysMax: 8 },
        { url: "5226521156764340272", daysMin: 9, daysMax: 12 },
        { url: "5224528579701806800", daysMin: 13, daysMax: 16 },
        { url: "5224530920458980477", daysMin: 17, daysMax: 22 },
        { url: "5224196071923683270", daysMin: 23, daysMax: 30 },
        { url: "5224673749596411018", daysMin: 31, daysMax: 45 },
        { url: "5224203158619722114", daysMin: 46, daysMax: 60 },
        { url: "5224343728604352036", daysMin: 61, daysMax: 89 },
        { url: "5224479788873323449", daysMin: 90, daysMax: 120 },
      ];

      const grayLightUrl = '5224728012213228232'

      const goalsTime = await checkGoalCompletion(userId.id);

      const timeGoalsSaving = await getUserSavingGoals(userId.telegramId)

      const inProgress = goalsTime.filter(g => g.status === 'in_progress');
      const inDone = goalsTime.filter(g => g.status === 'completed');

      const num = computeSeries(timeGoalsSaving?.savingGoals);
      const isTodayCompleted = getIsTodayCompleted(timeGoalsSaving?.savingGoals);

      const currentLight =
        levelsOfLights.find(
          (level) => num >= level.daysMin && num <= level.daysMax
        ) || levelsOfLights[levelsOfLights.length - 1];

      const finalUrl = isTodayCompleted
        ? currentLight.url
        : grayLightUrl;

      if (timeOfDay === 'morning') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const day = yesterday.toISOString().split('T')[0];

        const savingGoalsDay = await getUserSavingGoalsWithAutoPeriod(userId.telegramId);
        const savingGoals = await getUserSavingGoals(userId.telegramId);

        const TheLastNumber = savingGoals.savingGoals?.length - 1;
        const TheLastDay = savingGoals?.savingGoals[TheLastNumber]?.date;


        if (TheLastDay && day === TheLastDay) {
          await clearAllSavingGoals(userId.telegramId);
          await bot.telegram.sendMessage(userId.telegramId, 'У вас нет целей, возможно вы их не взяли или у них закончился срок выполнения❗️\nНужно зайти в приложение и снова взять себе цели', {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
              ]
            }
          });
        }

        if (savingGoalsDay.savingGoals?.length !== 0) {
          let i = savingGoalsDay.savingGoals.length - 1;
          if (savingGoalsDay.savingGoals[i].goalData.length === 0) {
            await bot.telegram.sendMessage(userId.telegramId, 'У ваших целей истёк срок выполнения❗️\nНужно зайти в приложение и снова взять себе цель', {
              reply_markup: {
                inline_keyboard: [
                  [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
                ]
              }
            });
          }
        }

        if (inProgress.length === 0 && inDone.length === 0) {
          const morningWithoutGoals = [
            `🌅 Доброе утро.\n\nСегодня можно выбрать цель и начать отслеживать прогресс.`,
            `☀️ Новый день.\n\nЕсли хочешь, загляни в приложение и выбери цель для себя.`,
            `🌤 Утро.\n\nНебольшая цель сегодня — шаг к изменениям завтра.`
          ];

          const randomMessage = morningWithoutGoals[Math.floor(Math.random() * morningWithoutGoals.length)];

          await bot.telegram.sendMessage(userId.telegramId, randomMessage, {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
              ]
            }
          });
        }

        if (inProgress.length !== 0 || inDone.length !== 0) {

          const morningWithGoals = [
            `🌅 Доброе утро.\n\nСегодня у тебя есть цели.\nЗагляни в приложение и начни день с первого шага.`,
            `☀️ Новый день начался.\n\nЦели на сегодня уже ждут тебя в приложении.`,
            `🌤 Утро — время задать тон дню.\n\nОткрой приложение и посмотри цели на сегодня.`
          ];

          const randomMessage =
            morningWithGoals[Math.floor(Math.random() * morningWithGoals.length)];

          let finalText = randomMessage;
          let entities = undefined;

          if (num > 0) {

            const emojiPlaceholder = '🔥';

            finalText = `${emojiPlaceholder} Серия: ${num} дн.\n\n${randomMessage}`;

            entities = [
              {
                offset: 0,
                length: emojiPlaceholder.length,
                type: 'custom_emoji',
                custom_emoji_id: finalUrl
              }
            ];
          }

          await bot.telegram.sendMessage(userId.telegramId, finalText, {
            entities: entities,
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
                [Markup.button.callback('🎯 Мои цели', 'show_goals')],
              ]
            }
          });
        }

      }

      if (timeOfDay === 'evening') {

        if (inProgress.length === 0 && inDone.length === 0) {
          const text = `🌙 Вечернее напоминание.\n\nВы можете выбрать цели и начать отслеживать свой прогресс уже сегодня.`;
          await bot.telegram.sendMessage(userId.telegramId, text, {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url('🚀 Открыть приложение', `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
              ]
            }
          });
        }

        if (inProgress.length === 0 && inDone.length !== 0) {

          const baseText = `🌙 День закрыт идеально.\n\nВсе цели выполнены — зафиксируйте результат и посмотрите отчёт за сегодня.`;

          let finalText = baseText;
          let entities = undefined;

          if (num > 0) {

            const emojiPlaceholder = '🔥';

            finalText = `${emojiPlaceholder} Серия: ${num} дн.\n\n${baseText}`;

            entities = [
              {
                offset: 0,
                length: emojiPlaceholder.length,
                type: 'custom_emoji',
                custom_emoji_id: finalUrl
              }
            ];
          }

          await bot.telegram.sendMessage(userId.telegramId, finalText, {
            entities: entities,
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback('📊 Получить отчёт', 'generation')],
              ]
            }
          });
        }

        if (inProgress.length !== 0) {

          const messages = [
            `🌇 День почти завершён.\n\nОтметьте сделанное и жмите — 📊 Сгенерировать отчёт`,
          
            `🌆 Вечер наступил — время подвести итоги.\n\nЖмите — 📊 Получить отчёт`,
          
            `🌙 Завершаем день красиво.\n\nОтметьте прогресс и жмите — 📊 Сформировать отчёт`,
          
            `🌃 Подводим итоги дня.\n\nЗафиксируйте результат и жмите — 📊 Отчёт`,
          
            `🌌 День был продуктивным?\n\nПора это отметить — 📊 Сгенерировать отчёт`,
          
            `🌙 Финальный шаг на сегодня.\n\nОтметьте выполненное и жмите — 📊 Получить отчёт`,
          
            `🌆 Закройте день с результатом.\n\nЖмите — 📊 Сформировать отчёт`
          ];

          const randomMessage = messages.length
            ? messages[Math.floor(Math.random() * messages.length)]
            : '';
          
          
          let finalText = null
          let entities = undefined;

          if (num > 0) {

            const emojiPlaceholder = '🔥';

            finalText = isTodayCompleted
              ? `${emojiPlaceholder} Серия: ${num} дн.\n\n${randomMessage}`
              : `${emojiPlaceholder} Серия: ${num} дн.\n\nУ вас последний шанс сохранить серию!\n\n${randomMessage}`;

            entities = [
              {
                offset: 0,
                length: emojiPlaceholder.length,
                type: 'custom_emoji',
                custom_emoji_id: finalUrl
              }
            ];
          } else { finalText = randomMessage; }

          const sent = await bot.telegram.sendMessage(userId.telegramId, finalText, {
            entities: entities,
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback('✅ Отметить цели', 'in_progress_goals')],
                [Markup.button.callback('📊 Получить отчёт', 'generation')],
              ]
            }
          });

          selectedByMessage.set(sent.message_id, { selected: new Set(), type: 'reminder' });
          goalsApi = goalsTime;
        }

      }

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
    `НЕ ЗАБУДЬТЕ ПРОЙТИ ОБУЧЕНИЕ В ПРИЛОЖЕНИИ!\n\n` +

    `Если у вас возникли какие-то вопросы по нашему приложению или боту, вы можете найти ответы здесь.\n\n` +

    `*Частые вопросы:*\n` +
    `/why - Зачем нужен бот Дневные достижения?\n` +
    `/newGoals - Как взять себе цели?\n` +
    `/accomplishment - Как выполнить или отменить выполнение цели?\n` +
    `/deleteGoals - Как удалить у себя цель?\n` +
    `/personalGoals - Как добавить свою личную цель?\n` +
    `/yesterday - Что делать если забыл отметить вчера цели?\n` +
    `/series - Как начать серию (огонёк)?\n` +
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

Это простой помощник, чтобы *держать дисциплину* и видеть прогресс по целям.

*Как это работает:*
1) Вы выбираете цели в приложении *(на 30 / 60 / 120 дней)*
2) Каждый день отмечаете выполнение
3) Бот помогает не забывать и показывает результат

*Что вы получаете:*
• 🔥 серию дней (streak), когда вы делаете хотя бы 1 цель в день  
• 🏆 очки и достижения за регулярность  
• 📊 отчёты по дню / неделе / месяцу  

Главная идея простая: *маленький шаг каждый день = большой результат со временем*.
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

bot_.command('series', async (ctx) => {
  try {
    await ctx.replyWithMarkdown(
      `*🔥 Серия (огонёк) — как начать и не потерять*
\nСерия начинается, когда вы выполняете *2 дня подряд* хотя бы *1 цель*.
\nДальше серия растёт каждый день, если в этом дне есть хотя бы *1 выполненная цель*.
\nЕсли пропустить день (нет ни одной выполненной цели) — серия сбрасывается.`,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Закрыть', 'message_close')],
        ]).reply_markup
      }
    );
  } catch (error) {
    console.error('Error sending series text:', error);
    await ctx.reply('❌ Произошла ошибка при отправке сообщения. Попробуйте позже.');
  }
});

bot_.command('newGoals', async (ctx) => {
  try {
    await ctx.replyWithMarkdown(
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
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Закрыть', 'message_close')],
        ]).reply_markup
      }
    );

  } catch (error) {
    console.error('Error sending newGoals text:', error);
    await ctx.reply('❌ Произошла ошибка при отправке сообщения. Попробуйте позже.');
  }
});

bot_.command('accomplishment', async (ctx) => {
  try {
    await ctx.replyWithMarkdown(
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
      {
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
    `*🗑 Как удалить цель?*

Если цель больше не актуальна, вы можете удалить её в любой момент 👇

📌 *Пошагово:*  
1️⃣ Найдите цель, которую хотите удалить  
2️⃣ *Зажмите палец* на этой цели и подождите  
3️⃣ Внизу появится *красная кнопка* **«Удалить цель»**  
4️⃣ Нажмите на неё — цель будет удалена

⚠️ *Обратите внимание:* после удаления цели её снова можно будет найти в разделе *Доступные* и взять её а прогресс на ей сохранится.`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('personalGoals', async (ctx) => {
  await ctx.replyWithMarkdown(
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
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('yesterday', async (ctx) => {
  await ctx.replyWithMarkdown(
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
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('report', async (ctx) => {
  await ctx.replyWithMarkdown(
    `*📊 Откуда взять дневной/недельный/месяцный отчёт??*

Бот автоматически помогает отслеживать ваши достижения на разных промежутках времени 👇

🗓 *Дневной отчёт*  
На главном экране есть кнопка **«Сгенерировать отчёт»**.  
Нажмите на неё — бот создаст отчёт по *сегодняшним целям*.  
Вы можете **скопировать текст** и отправить его куда угодно.

📅 *Недельный отчёт*  
Недельный отчёт **приходит автоматически**.  
Бот присылает его **каждое воскресенье в 20:00** ⏰  
В нём — ваш прогресс за всю неделю.

🗓 *Месячный отчёт*  
🚧 В разработке. Скоро станет доступен!

💡 Отчёты помогают видеть реальный прогресс и сохранять мотивацию.`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('achievements', async (ctx) => {

  await ctx.replyWithMarkdown(
    `*🎖 Как получить ачивку?*\n\n` +
    `1. Выберите ачивку, которую хотите получить.\n` +
    `2. Нажмите на неё — вы увидите её анимацию.\n` +
    `3. Под анимацией будет написано, что нужно сделать, чтобы получить эту ачивку.\n\n` +
    `*⚠ Важно!* Эпические ачивки доступны только в определённый период. После его окончания получить их будет невозможно!\n` +
    `Чтобы не пропустить эпические ачивки, следите за нашими новостями в канале *@Motivation_bot_channel*`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('❌ Закрыть', 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('history', async (ctx) => {

  await ctx.replyWithMarkdown(
    `*🎖 Как поделиться ачивкой (историей)*\n\n` +
    `1. Выберите ачивку, которую хотите опубликовать. Обратите внимание: делиться можно только ачивками, которые у вас уже есть.\n` +
    `2. Нажмите на неё — вы увидите её анимацию.\n` +
    `3. Под анимацией появится кнопка *Поделиться / История*. Дождитесь, пока ачивка загрузится, и затем сможете опубликовать её в истории.\n\n` +
    `*⚠ Важно!* Делиться можно только теми ачивками, которые вы действительно имеете.`,
    {
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

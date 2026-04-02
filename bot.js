import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { getAllUserIds, getUserData, generateSavingGoalsReport, getAllGoals, getUserSavingGoals, clearAllSavingGoals, getUserSavingGoalsWithAutoPeriod, updateSavingGoalStatus, addProfile, initializeUserGoals, checkGoalCompletion, getAllStatus, addPoints, getGeneraleText, updateUserLanguage, fetchUserLanguage } from './Api/Api.js';
import cron from 'node-cron';
import sharp from 'sharp';
import path from 'path';
import { MESSAGES } from './i18n/messages.js';

const FONT_DIR = path.join(process.cwd(), 'fonts');
process.env.FONTCONFIG_PATH = FONT_DIR;
process.env.FONTCONFIG_FILE = path.join(FONT_DIR, 'fonts.conf');

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

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

// Если присылают кастомный эмодзи (Premium) или стикер — вернём его ID
// bot.on('message', async (ctx, next) => {
//   try {
//     const msg = ctx.message;

//     // 1) Custom Emoji в тексте/подписи (entities / caption_entities)
//     const entities = [
//       ...(msg?.entities || []),
//       ...(msg?.caption_entities || []),
//     ];
//     const customEmojiIds = entities
//       .filter((e) => e?.type === 'custom_emoji' && e?.custom_emoji_id)
//       .map((e) => e.custom_emoji_id);

//     if (customEmojiIds.length > 0) {
//       const unique = [...new Set(customEmojiIds)];
//       await ctx.reply(`custom_emoji_id:\n${unique.join('\n')}`);
//       return;
//     }

//     // 2) Стикер (у обычных стикеров будет file_id; у кастом-эмодзи-стикеров может быть custom_emoji_id)
//     const sticker = msg?.sticker;
//     if (sticker) {
//       const lines = [];
//       if (sticker.custom_emoji_id) lines.push(`custom_emoji_id: ${sticker.custom_emoji_id}`);
//       if (sticker.file_id) lines.push(`file_id: ${sticker.file_id}`);
//       if (sticker.file_unique_id) lines.push(`file_unique_id: ${sticker.file_unique_id}`);
//       if (lines.length > 0) {
//         await ctx.reply(lines.join('\n'));
//         return;
//       }
//     }
//   } catch (e) {
//     console.error('emoji id handler error:', e?.message || e);
//   }

//   return next?.();
// });

function dbToUiLanguage(dbLanguage) {
  const normalized = dbLanguage ? String(dbLanguage).toLowerCase() : null;
  return normalized === 'ang' ? 'en' : 'ru';
}

function getMessages(lang) {
  return lang === 'en' ? MESSAGES.en : MESSAGES.ru;
}

async function getLangFromCtx(ctx) {
  const dbLanguage = await fetchUserLanguage(ctx.from?.id);
  const lang = dbToUiLanguage(dbLanguage);
  return { lang };
}

async function resolveUserLang(telegramId) {
  try {
    const dbLanguage = await fetchUserLanguage(telegramId);
    return dbToUiLanguage(dbLanguage);
  } catch (_) {
    return 'ru';
  }
}

bot.start(async (ctx) => {
  const loading = await ctx.reply('⏳ Loading');
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
    const m = getMessages('ru');
    await ctx.replyWithMarkdown(
      m.startLanguagePrompt,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(m.callbacks.langRuLabel, 'set_lang_ru')],
          [Markup.button.callback(m.callbacks.langEnLabel, 'set_lang_en')],
        ]).reply_markup
      }
    );

  }

});

bot.action('set_lang_ru', async (ctx) => {
  try {
    await updateUserLanguage(ctx.from?.id, 'ru');
  } catch (e) {
    console.error('updateUserLanguage ru failed:', e?.message || e);
  }

  await ctx.answerCbQuery('Язык: Русский');
  try {
    await ctx.deleteMessage();
  } catch (_) {
    // ignore if message is already deleted/not deletable
  }

  // В каждом хэндлере берём профиль и язык (rus/ang) из БД
  const { lang } = await getLangFromCtx(ctx);
  const m = getMessages(lang);

  await ctx.replyWithMarkdown(
    m.startWelcomeText(ctx.from.first_name),
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url(m.startWelcomeButtonText, `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
      ]).reply_markup
    }
  );
});

bot.action('set_lang_en', async (ctx) => {
  try {
    await updateUserLanguage(ctx.from?.id, 'en');
  } catch (e) {
    console.error('updateUserLanguage en failed:', e?.message || e);
  }

  await ctx.answerCbQuery('Language: English');
  try {
    await ctx.deleteMessage();
  } catch (_) {
    // ignore if message is already deleted/not deletable
  }

  // В каждом хэндлере берём профиль и язык (rus/ang) из БД
  const { lang } = await getLangFromCtx(ctx);
  const m = getMessages(lang);

  await ctx.replyWithMarkdown(
    m.startWelcomeText(ctx.from.first_name),
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url(m.startWelcomeButtonText, `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
      ]).reply_markup
    }
  );
});

bot.command('goals', async (ctx) => {
  try {
    const profile = await addProfile(ctx);
    const lang = await resolveUserLang(profile?.telegramId);
    const m = getMessages(lang);
    const loading = await ctx.reply(m.commands.goals.loading);
    const uid = profile?.id;
    if (uid) {
      const goalsTime = await checkGoalCompletion(uid);
      const goals = await initializeUserGoals(uid);

      goalsApi = goalsTime || goals;

      await ctx.deleteMessage(loading.message_id);

      return ctx.replyWithMarkdown(
        m.commands.goals.menuText,
        Markup.inlineKeyboard([
          [Markup.button.callback(m.commands.goals.buttons.inProgress, 'in_progress_goals')],
          [Markup.button.callback(m.commands.goals.buttons.done, 'done_goals')],
          [Markup.button.callback(m.common.close, 'close_message')],
        ])
      );
    }
  } catch (err) {
    console.error(err);
    try {
      const profile = await addProfile(ctx);
      const lang = await resolveUserLang(profile?.telegramId);
      const m = getMessages(lang);
      await ctx.reply(m.commands.goals.error);
    } catch (_) {
      await ctx.reply('❌ Ошибка при загрузке целей, попробуй позже.');
    }
  }
});

bot.command('mini_aps', async (ctx) => {
  const profile = await addProfile(ctx);
  const lang = await resolveUserLang(profile?.telegramId);
  const m = getMessages(lang);

  await ctx.replyWithMarkdown(
    m.commands.mini_aps.title,
    Markup.inlineKeyboard([
      [Markup.button.webApp(m.common.openApp, `https://motivation-oz64-7lohqqx23-stepans-projects-e54d3120.vercel.app/`)],
      [Markup.button.callback(m.common.close, 'close_message')],
    ])
  );
});

bot.command('info', async (ctx) => {
  const profile = await addProfile(ctx);
  const lang = await resolveUserLang(profile?.telegramId);
  const m = getMessages(lang);
  await ctx.replyWithMarkdown(
    lang === 'en' ? m.commands.info.text : `ℹ️ *О проекте «Дневные достижения»*\n\n` +
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

    `🧭 Используй бота каждый день.\n` +
    `Даже маленькие действия, сделанные регулярно,\n` +
    `дают сильный результат.\n\n` +
    `❓ Вопросы и помощь: *@keep_alive_Assistant_bot*\n` +
    `📢 Канал проекта: *@Motivation_bot_channel*`,
    Markup.inlineKeyboard([
      [Markup.button.callback(m.commands.info.close, 'close_message')],
    ])
  );
});

bot.command('generate', async (ctx) => {
  let loading = null;
  let m = getMessages('ru');
  try {
    const profile = await addProfile(ctx);
    const lang = await resolveUserLang(profile?.telegramId);
    m = getMessages(lang);
    loading = await ctx.reply(m.commands.generate.loading);
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
        return ctx.reply(m.commands.generate.noGoals);
      }

      const series = computeSeries(timeGoalsSaving?.savingGoals);
      const isTodayCompleted = getIsTodayCompleted(timeGoalsSaving?.savingGoals);

      const levelsOfLights = [
        { url: "5363843321485629976", daysMin: 2, daysMax: 9 },
        { url: "5364350071791980859", daysMin: 10, daysMax: 19 },
        { url: "5364279737407542873", daysMin: 20, daysMax: 35 },
        { url: "5363901638551570334", daysMin: 36, daysMax: 50 },
        { url: "5363967974321462175", daysMin: 51, daysMax: 65 },
        { url: "5364003094269038792", daysMin: 66, daysMax: 80 },
        { url: "5364130818006490766", daysMin: 81, daysMax: 95 },
        { url: "5364125127174824316", daysMin: 96, daysMax: 110 },
        { url: "5364242019004749954", daysMin: 111, daysMax: 140 },
        { url: "5364093331531928721", daysMin: 141, daysMax: 190 },
      ];
      const grayLightUrl = '5224728012213228232';

      const currentLight = levelsOfLights.find(
        (level) => series >= level.daysMin && series <= level.daysMax
      ) || levelsOfLights[levelsOfLights.length - 1];
      const lightUrl = isTodayCompleted ? currentLight.url : grayLightUrl;

      const generateText = await getGeneraleText(
        series,
        userTag,
        userData.telegramId,
        goalsDone,
        goalsInProgress,
        lang
      );

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
    if (loading?.message_id) await ctx.deleteMessage(loading.message_id);
    await ctx.reply(m.commands.generate.error);
  }
});

bot.action('Done_goals_generation', async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  const messageInfo = selectedByMessage.get(msgId) || { selected: new Set(), type: null };
  const selected = messageInfo.selected;

  const profile = await addProfile(ctx);
  const lang = await resolveUserLang(profile?.telegramId);
  const m = getMessages(lang);

  if (selected.size !== 0) {

    const chosen = (goalsApi || []).filter(g => selected.has(g.id));

    const loading = await ctx.reply(m.actions.doneGoalsGeneration.updateLoading);

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
      await ctx.reply(m.actions.doneGoalsGeneration.updateError);
    } finally {
      selectedByMessage.delete(msgId);
    }
  }

  try {

    const loading = await ctx.reply(m.actions.doneGoalsGeneration.generationLoading);

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
        return ctx.reply(m.commands.generate.noGoals);
      }

      const timeGoalsSaving = await getUserSavingGoals(ctx.from.id);
      const series = computeSeries(timeGoalsSaving?.savingGoals);

      const generateText = await getGeneraleText(
        series,
        userTag,
        userData.telegramId,
        goalsDone,
        goalsInProgress,
        lang
      );

      await ctx.deleteMessage(loading.message_id)

      await ctx.reply(generateText);
    }

  } catch (e) {
    console.error('Done_goals_generation error:', e.message);
  }

});

bot.action('show_goals', async (ctx) => {
  try {
    const profile = await addProfile(ctx);
    const lang = await resolveUserLang(profile?.telegramId);
    const m = getMessages(lang);
    const loading = await ctx.reply(m.commands.goals.loading);
    const uid = profile?.id;
    if (uid) {
      const goalsTime = await checkGoalCompletion(uid);
      const goals = await initializeUserGoals(uid);

      goalsApi = goalsTime || goals;

      await ctx.deleteMessage(loading.message_id);

      return ctx.replyWithMarkdown(
        m.commands.goals.menuText,
        Markup.inlineKeyboard([
          [Markup.button.callback(m.commands.goals.buttons.inProgress, 'in_progress_goals')],
          [Markup.button.callback(m.commands.goals.buttons.done, 'done_goals')],
          [Markup.button.callback(m.common.close, 'close_message')],
        ])
      );
    }
  } catch (err) {
    console.error(err);
    try {
      const profile = await addProfile(ctx);
      const lang = await resolveUserLang(profile?.telegramId);
      const m = getMessages(lang);
      await ctx.reply(m.commands.goals.error);
    } catch (_) {
      const m = getMessages('ru');
      await ctx.reply(m.commands.goals.error);
    }
  }

});

bot.action('done_goals', async (ctx) => {
  try {
    const profile = await addProfile(ctx);
    const lang = await resolveUserLang(profile?.telegramId);
    const m = getMessages(lang);
    const loading = await ctx.reply(m.actions.doneGoals.loading);
    const uid = profile?.id;
    if (uid) {
      const goalsTime = await checkGoalCompletion(uid);
      const goals = await initializeUserGoals(uid);

      goalsApi = goalsTime || goals;

      await ctx.deleteMessage(loading.message_id);
      await ctx.answerCbQuery();

      const done = (goalsApi || []).filter(g => g.status === "completed");
      if (done.length === 0)
        return ctx.reply(m.actions.doneGoals.none, Markup.inlineKeyboard([
          [Markup.button.callback(m.common.close, 'close_message')],
        ]));

      const msg = done.map((g, i) => `• ${g.title}`).join('\n');
      await ctx.reply(
        m.actions.doneGoals.headerWithMsg(msg),
        Markup.inlineKeyboard([[Markup.button.callback(m.common.close, 'close_message')]])
      );
    }
  } catch (err) {
    console.error(err);
    try {
      const profile = await addProfile(ctx);
      const lang = await resolveUserLang(profile?.telegramId);
      const m = getMessages(lang);
      await ctx.reply(m.actions.doneGoals.error);
    } catch (_) {
      const m = getMessages('ru');
      await ctx.reply(m.actions.doneGoals.error);
    }
  }
});

function buildInProgressKeyboard(inProgress, selectedSet, messageType = null, goals, userId, lang = 'ru') {
  const maxLen = Math.max(...inProgress.map(g => g.title.length));

  console.log(goals, '392')

  const m = getMessages(lang);

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
    rows.push([Markup.button.callback(m.actions.inProgressGoals.buttons.reminder, 'Done_goals_generation')]);
  } else {
    rows.push([Markup.button.callback(m.actions.inProgressGoals.buttons.execute, 'Done_goals')]);
  }

  rows.push([Markup.button.callback(m.common.close, 'close_message')]);

  return Markup.inlineKeyboard(rows, { columns: 1 });
}

bot.action(/^toggle_goal_(.+)$/, async (ctx) => {
  const goalId = ctx.match[1];
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  await ctx.answerCbQuery();

  if (!msgId) return;

  // язык для текста/кнопок на экране
  const profile = await addProfile(ctx);
  const lang = await resolveUserLang(profile?.telegramId);
  const m = getMessages(lang);

  // Получаем информацию о сообщении
  const messageInfo = selectedByMessage.get(msgId) || { selected: new Set(), type: null };

  // Определяем тип сообщения, если еще не установлен
  if (!messageInfo.type) {
    // Для напоминаний в тексте всегда есть `📊` и подпись про отчёт.
    const isReminder = msg.text && msg.text.includes('📊');
    messageInfo.type = isReminder ? 'reminder' : 'regular';
  }

  // Обновляем выбор
  messageInfo.selected.has(goalId) ? messageInfo.selected.delete(goalId) : messageInfo.selected.add(goalId);
  selectedByMessage.set(msgId, messageInfo);

  const inProgress = (goalsApi || []).filter(g => g.status === 'in_progress');

  try {
    await ctx.editMessageReplyMarkup(
      buildInProgressKeyboard(
        inProgress,
        messageInfo.selected,
        messageInfo.type,
        undefined,
        undefined,
        lang
      ).reply_markup
    );
  } catch (e) {
    console.error('editMessageReplyMarkup error:', e.message);
  }
});

bot.action('in_progress_goals', async (ctx) => {
  try {
    const profile = await addProfile(ctx);
    const lang = await resolveUserLang(profile?.telegramId);
    const m = getMessages(lang);
    const loading = await ctx.reply(m.actions.inProgressGoals.loading);
    const uid = profile?.id;
    if (uid) {
      const goalsTime = await checkGoalCompletion(uid);
      const goals = await initializeUserGoals(uid);

      goalsApi = goalsTime || goals;

      await ctx.deleteMessage(loading.message_id);
      await ctx.answerCbQuery();

      const inProgress = (goalsApi || []).filter(g => g.status === 'in_progress');
      if (inProgress.length === 0) {
        return ctx.reply(
          m.actions.inProgressGoals.none,
          Markup.inlineKeyboard([[Markup.button.callback(m.common.close, 'close_message')]])
        );
      }

      const sent = await ctx.replyWithMarkdown(
        m.actions.inProgressGoals.text,
        buildInProgressKeyboard(inProgress, new Set(), 'regular', undefined, undefined, lang)
      );

      selectedByMessage.set(sent.message_id, { selected: new Set(), type: 'regular' });
    }
  } catch (err) {
    console.error(err);
    try {
      const profile = await addProfile(ctx);
      const lang = await resolveUserLang(profile?.telegramId);
      const m = getMessages(lang);
      await ctx.reply(m.actions.inProgressGoals.error);
    } catch (_) {
      const m = getMessages('ru');
      await ctx.reply(m.actions.inProgressGoals.error);
    }
  }
});

bot.action('Done_goals', async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const msgId = msg?.message_id;
  const messageInfo = selectedByMessage.get(msgId) || { selected: new Set(), type: null };
  const selected = messageInfo.selected;

  const profile = await addProfile(ctx);
  const lang = await resolveUserLang(profile?.telegramId);
  const m = getMessages(lang);

  if (selected.size === 0) {
    return ctx.answerCbQuery(m.actions.doneGoals.noSelected, { show_alert: true });
  }

  const chosen = (goalsApi || []).filter(g => selected.has(g.id));

  const loading = await ctx.reply(m.actions.doneGoalsGeneration.updateLoading);

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
      { url: "5363843321485629976", daysMin: 2, daysMax: 9 },
      { url: "5364350071791980859", daysMin: 10, daysMax: 19 },
      { url: "5364279737407542873", daysMin: 20, daysMax: 35 },
      { url: "5363901638551570334", daysMin: 36, daysMax: 50 },
      { url: "5363967974321462175", daysMin: 51, daysMax: 65 },
      { url: "5364003094269038792", daysMin: 66, daysMax: 80 },
      { url: "5364130818006490766", daysMin: 81, daysMax: 95 },
      { url: "5364125127174824316", daysMin: 96, daysMax: 110 },
      { url: "5364242019004749954", daysMin: 111, daysMax: 140 },
      { url: "5364093331531928721", daysMin: 141, daysMax: 190 },
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
    let resultText = m.actions.doneGoalsGeneration.success;
    let entities = undefined;

    if (num >= 2) {

      const emojiPlaceholder = '🔥';

      if (num === 2) {
        resultText = m.actions.doneGoalsGeneration.seriesStarted(num).replace(
          '🔥',
          emojiPlaceholder
        );
      } else {
        resultText = m.actions.doneGoalsGeneration.seriesContinues(num).replace(
          '🔥',
          emojiPlaceholder
        );
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
    await ctx.reply(m.actions.doneGoalsGeneration.updateError);
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
  const profile = await addProfile(ctx);
  const lang = await resolveUserLang(profile?.telegramId);
  const m = getMessages(lang);
  await ctx.reply(
    m.commands.channel.text,
    Markup.inlineKeyboard([
      [Markup.button.callback(m.common.close, 'close_message')]
    ])
  );
});

bot.command('support', async (ctx) => {
  const profile = await addProfile(ctx);
  const lang = await resolveUserLang(profile?.telegramId);
  const m = getMessages(lang);
  await ctx.replyWithPhoto(
    { source: './Img/qr.jpg' },
    {
      caption: m.commands.support.caption,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.url(m.commands.support.supportButton, 'https://www.tinkoff.ru/rm/r_adpKgpwYuC.VvrLvQmxSb/GjWkK97277')],
        [Markup.button.callback(m.common.close, 'close_message')],
      ]).reply_markup
    }
  );
});

bot.command('a', async (ctx) => {
  sendWeeklyReport()
  // sendDailyReminders('evening')
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
<text x="${width - padding + 6}" y="${avgY}">${avg}% </text>

${points.map(p => `
<circle cx="${p.x}" cy="${p.y}" r="5" fill="${p.color}"/>
<text x="${p.x}" y="${p.y - 10}" text-anchor="middle">${p.p}%</text>
`).join('')}

${dates.map((d, i) => `
<text x="${padding + i * stepX}" y="${height - 10}" text-anchor="middle">
${d.slice(5)}${i === todayIndex ? '' : ''}
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
        const lang = await resolveUserLang(profile?.telegramId);
        const m = getMessages(lang);

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
          m.weeklyReport.greeting(profile.firstName)
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
            caption: m.weeklyReport.photoCaption
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
        { url: "5363843321485629976", daysMin: 2, daysMax: 9 },
        { url: "5364350071791980859", daysMin: 10, daysMax: 19 },
        { url: "5364279737407542873", daysMin: 20, daysMax: 35 },
        { url: "5363901638551570334", daysMin: 36, daysMax: 50 },
        { url: "5363967974321462175", daysMin: 51, daysMax: 65 },
        { url: "5364003094269038792", daysMin: 66, daysMax: 80 },
        { url: "5364130818006490766", daysMin: 81, daysMax: 95 },
        { url: "5364125127174824316", daysMin: 96, daysMax: 110 },
        { url: "5364242019004749954", daysMin: 111, daysMax: 140 },
        { url: "5364093331531928721", daysMin: 141, daysMax: 190 },
      ];

      const grayLightUrl = '5224728012213228232'

      const goalsTime = await checkGoalCompletion(userId.id);

      const timeGoalsSaving = await getUserSavingGoals(userId.telegramId)

      // язык пользователя берём из БД
      const profileLangData = await getUserData(userId.telegramId);
      const lang = dbToUiLanguage(profileLangData?.language);
      const m = getMessages(lang);

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
          await bot.telegram.sendMessage(userId.telegramId, m.reminders.noGoalsInMorningText, {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url(m.reminders.uiButtons.openApp, `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
              ]
            }
          });
        }

        if (savingGoalsDay.savingGoals?.length !== 0) {
          let i = savingGoalsDay.savingGoals.length - 1;
          if (savingGoalsDay.savingGoals[i].goalData.length === 0) {
            await bot.telegram.sendMessage(userId.telegramId, m.reminders.noGoalsExpiredText, {
              reply_markup: {
                inline_keyboard: [
                  [Markup.button.url(m.reminders.uiButtons.openApp, `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
                ]
              }
            });
          }
        }

        if (inProgress.length === 0 && inDone.length === 0) {
          const morningWithoutGoals = m.reminders.morningWithoutGoals;

          const randomMessage = morningWithoutGoals[Math.floor(Math.random() * morningWithoutGoals.length)];

          await bot.telegram.sendMessage(userId.telegramId, randomMessage, {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url(m.reminders.uiButtons.openApp, `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
              ]
            }
          });
        }

        if (inProgress.length !== 0 || inDone.length !== 0) {
          const morningWithGoals = m.reminders.morningWithGoals;

          const randomMessage =
            morningWithGoals[Math.floor(Math.random() * morningWithGoals.length)];

          let finalText = randomMessage;
          let entities = undefined;

          if (num > 0) {

            const emojiPlaceholder = '🔥';

            finalText = m.reminders.streakWithNumAndText(num, randomMessage);

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
                [Markup.button.url(m.reminders.uiButtons.openApp, `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
                [Markup.button.callback(m.reminders.uiButtons.myGoals, 'show_goals')],
              ]
            }
          });
        }

      }

      if (timeOfDay === 'evening') {

        if (inProgress.length === 0 && inDone.length === 0) {
          const text = m.reminders.eveningNoGoalsText;
          await bot.telegram.sendMessage(userId.telegramId, text, {
            reply_markup: {
              inline_keyboard: [
                [Markup.button.url(m.reminders.uiButtons.openApp, `https://t.me/BotMotivation_TG_bot?startapp=fullscreen`)],
              ]
            }
          });
        }

        if (inProgress.length === 0 && inDone.length !== 0) {

          const baseText = m.reminders.eveningAllDoneText;

          let finalText = baseText;
          let entities = undefined;

          if (num > 0) {

            const emojiPlaceholder = '🔥';

            finalText = m.reminders.streakWithNumAndText(num, baseText);

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
                [Markup.button.callback(m.reminders.uiButtons.report, 'generation')],
              ]
            }
          });
        }

        if (inProgress.length !== 0) {

          const messages = m.reminders.eveningMessages;

          const randomMessage = messages.length
            ? messages[Math.floor(Math.random() * messages.length)]
            : '';
          
          
          let finalText = null
          let entities = undefined;

          if (num > 0) {

            const emojiPlaceholder = '🔥';

            finalText = isTodayCompleted
              ? m.reminders.streakWithNumAndText(num, randomMessage)
              : m.reminders.streakLastChanceWithNum(num, randomMessage);

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
                [Markup.button.callback(m.reminders.uiButtons.markGoals, 'in_progress_goals')],
                [Markup.button.callback(m.reminders.uiButtons.report, 'generation')],
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

async function getBot2Texts(ctx) {
  const lang = await resolveUserLang(ctx.from?.id);
  const m = getMessages(lang);
  return m.bot2;
}

bot_.command('start', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.startText
  );
});

bot_.command('why', async (ctx) => {
  try {
    const t = await getBot2Texts(ctx);

    await ctx.replyWithMarkdown(
      t.whyText,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(t.common.close, 'message_close')],
        ]).reply_markup
      });

  } catch (error) {
    console.error('Error sending newGoals photo:', error);
    const t = await getBot2Texts(ctx);
    await ctx.reply(t.errorLoadImage);
  }
});

bot_.command('series', async (ctx) => {
  try {
    const t = await getBot2Texts(ctx);
    await ctx.replyWithMarkdown(
      t.seriesText,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(t.common.close, 'message_close')],
        ]).reply_markup
      }
    );
  } catch (error) {
    console.error('Error sending series text:', error);
    const t = await getBot2Texts(ctx);
    await ctx.reply(t.errorSendMessage);
  }
});

bot_.command('newGoals', async (ctx) => {
  try {
    const t = await getBot2Texts(ctx);
    await ctx.replyWithMarkdown(
      t.newGoalsText,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(t.common.close, 'message_close')],
        ]).reply_markup
      }
    );

  } catch (error) {
    console.error('Error sending newGoals text:', error);
    const t = await getBot2Texts(ctx);
    await ctx.reply(t.errorSendMessage);
  }
});

bot_.command('accomplishment', async (ctx) => {
  try {
    const t = await getBot2Texts(ctx);
    await ctx.replyWithMarkdown(
      t.accomplishmentText,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(t.common.close, 'message_close')],
        ]).reply_markup
      }
    );

  } catch (error) {
    console.error('Error sending newGoals photo:', error);
    const t = await getBot2Texts(ctx);
    await ctx.reply(t.errorLoadImage);
  }
});


bot_.command('deleteGoals', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.deleteGoalsText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.common.close, 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('personalGoals', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.personalGoalsText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.common.close, 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('yesterday', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.yesterdayText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.common.close, 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('report', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.reportText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.common.close, 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('achievements', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.achievementsText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.common.close, 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('history', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.historyText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.common.close, 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('continuation', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.continuationText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.continuationSupportButton, 'support')],
        [Markup.button.callback(t.common.close, 'message_close')],
      ]).reply_markup
    }
  );

});


bot_.command('slowdowns', async (ctx) => {
  const t = await getBot2Texts(ctx);
  await ctx.replyWithMarkdown(
    t.slowdownsText,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.common.close, 'message_close')],
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
    const t = await getBot2Texts(ctx);
    await ctx.replyWithPhoto(
      { source: './Img/qr.jpg' },
      {
        caption: t.supportCaption,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url(t.common.support, 'https://www.tinkoff.ru/rm/r_adpKgpwYuC.VvrLvQmxSb/GjWkK97277')],
          [Markup.button.callback(t.common.close, 'message_close')],
        ]).reply_markup
      }
    );
  } catch (error) {
    console.error('Error sending support photo:', error);
    const t = await getBot2Texts(ctx);
    await ctx.reply(t.errorLoadImage);
  }
});

bot_.launch();

process.once('SIGINT', () => bot_.stop('SIGINT'));
process.once('SIGTERM', () => bot_.stop('SIGTERM'));
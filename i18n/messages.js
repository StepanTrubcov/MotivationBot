export const MESSAGES = {
  ru: {
    startLanguagePrompt: 'Выберите язык бота\n\nSelect the bot\'s language',
    startWelcomeButtonText: '🚀 Пройти обучение',
    startWelcomeText: (firstName) =>
      `👋 Привет, ${firstName}!\n\n` +
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

    callbacks: {
      langRuLabel: '🇷🇺 Русский',
      langEnLabel: '🇺🇸 English',
      langRuAnswer: 'Язык: Русский',
      langEnAnswer: 'Language: English',
    },

    auth: {
      loadingAuthorization: '⏳ Подождите! Проверяем авторизацию.',
    },

    common: {
      close: '❌ Закрыть',
      openApp: '🚀 Открыть приложение',
      openAppGoToMiniApp: 'https://t.me/BotMotivation_TG_bot?startapp=fullscreen',
      myGoals: '🎯 Мои цели',
      report: '📊 Получить отчёт',
    },

    commands: {
      goals: {
        loading: '⏳ Загружаем твои цели...',
        menuText:
          `📋 *Твои цели*\n\n` +
          `Здесь собраны все цели, над которыми ты работаешь.\n\n` +
          `🟡 *В процессе* — цели, которые тебе нужно выполнить\n` +
          `✅ *Выполненные* — цели, которые уже выполнены\n\n` +
          `Выбери, что хочешь посмотреть:`,
        error: '❌ Ошибка при загрузке целей, попробуй позже.',
        buttons: {
          inProgress: '🟡 Цели в процессе',
          done: '✅ Выполненные цели',
          close: '❌ Закрыть',
        },
      },

      show_goals: {
        // bot.action('show_goals', ...) inline keyboard labels
        buttons: {
          inProgress: '🟡 В процессе',
          done: '✅ Выполненные цели',
          close: '❌ Закрыть',
        },
      },

      mini_aps: {
        title: '⚔️ Мини-приложение *Дневные достижения*\n\n',
      },

      info: {
        text:
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
          `🧭 Используй бота каждый день.\n` +
          `Даже маленькие действия, сделанные регулярно,\n` +
          `дают сильный результат.\n\n` +
          `❓ Вопросы и помощь: *@keep_alive_Assistant_bot*\n` +
          `📢 Канал проекта: *@Motivation_bot_channel*`,
        close: '❌ Закрыть',
      },

      generate: {
        loading: '⏳ Генерируем твой отчёт...',
        noGoals:
          '😴 Пока ничего нет — пора действовать. Возьми цели и начни движение.',
        error: '❌ Что-то пошло не так при генерации сообщения. Попробуй снова.',
      },

      channel: {
        text:
          `НОВОСТИ ПО БОТУ И ПРИЛОЖЕНИЮ\n\n` +
          `Этот бот и мини-приложение очень активно прокачиваются и обновляются.\n\n` +
          `Чтобы знать все изменения и знать все крутые фичи вы можете подписаться на наш канал!\n\n` +
          `Там мы постим все изменения и новые фичи !!! \n\n` +
          `@Motivation_bot_channel`,
      },

      support: {
        caption:
          `💚 *Поддержка проекта*\n\n` +
          `Если тебе нравится бот и приложение — ты можешь поддержать развитие проекта.\n\n` +
          `Спасибо, что ты с нами. ❄️`,
        supportButton: '💸 Поддержать проект',
      },
    },

    actions: {
      inProgressGoals: {
        loading: '⏳ Загружаем цели в процессе...',
        error: '❌ Ошибка при загрузке целей.',
        none:
          `Нет целей в процессе.\n` + `Возможно вы их не взяли или уже все выполнили`,
        text:
          `*Цели в процессе*\n\n` +
          `Отмете задачи (нажми на них, чтобы поставить зелёную галочку), затем нажмите на ✅ Выполнить`,
        buttons: {
          execute: '✅ Выполнить',
          reminder: '📊 Сгенерировать отчёт',
          close: '❌ Закрыть',
        },
      },

      doneGoals: {
        loading: '⏳ Проверяем выполненные цели...',
        none: '✅ Сегодня нет выполненных целей.',
        error: '❌ Ошибка при загрузке целей.',
        headerWithMsg: (msg) => `✅ Выполненные сегодня цели:\n\n${msg}`,
        close: '❌ Закрыть',
        noSelected: '⚠️ Нет выбранных целей!',
        updateLoading: '⏳ Обновляем цели...',
        updateError: '❌ Ошибка при обновлении целей, попробуй ещё раз.',
      },

      doneGoalsGeneration: {
        updateLoading: '⏳ Обновляем цели...',
        generationLoading: '⏳ Генерируем твой отчёт...',
        updateError: '❌ Ошибка при обновлении целей, попробуй ещё раз.',
        success: '✅ Успешно выполнено!',
        seriesStarted: (num) => `Серия начата: 🔥 ${num} дн.\n\n✅ Успешно выполнено!`,
        seriesContinues: (num) => `🔥 Серия: ${num} дн.\n\n✅ Успешно выполнено!`,
      },
    },

    weeklyReport: {
      greeting: (firstName) =>
        `👋 Привет, ${firstName}!\n\n` +
        `Неделя подошла к концу — самое время подвести итоги 🕊\n` +
        `Я подготовил для тебя отчёт 👇`,
      photoCaption: '📈 Прогресс выполнения целей за неделю',
    },

    reminders: {
      noGoalsInMorningText:
        'У вас нет целей, возможно вы их не взяли или у них закончился срок выполнения❗️\nНужно зайти в приложение и снова взять себе цели',
      noGoalsExpiredText:
        'У ваших целей истёк срок выполнения❗️\nНужно зайти в приложение и снова взять себе цель',

      morningWithoutGoals: [
        '🌅 Доброе утро.\n\nСегодня можно выбрать цель и начать отслеживать прогресс.',
        '☀️ Новый день.\n\nЕсли хочешь, загляни в приложение и выбери цель для себя.',
        '🌤 Утро.\n\nНебольшая цель сегодня — шаг к изменениям завтра.',
      ],
      morningWithGoals: [
        '🌅 Доброе утро.\n\nСегодня у тебя есть цели.\nЗагляни в приложение и начни день с первого шага.',
        '☀️ Новый день начался.\n\nЦели на сегодня уже ждут тебя в приложении.',
        '🌤 Утро — время задать тон дню.\n\nОткрой приложение и посмотри цели на сегодня.',
      ],

      eveningNoGoalsText:
        '🌙 Вечернее напоминание.\n\nВы можете выбрать цели и начать отслеживать свой прогресс уже сегодня.',
      eveningAllDoneText:
        '🌙 День закрыт идеально.\n\nВсе цели выполнены — зафиксируйте результат и посмотрите отчёт за сегодня.',

      eveningMessages: [
        '🌇 День почти завершён.\n\nОтметьте сделанное и жмите — 📊 Сгенерировать отчёт',
        '🌆 Вечер наступил — время подвести итоги.\n\nЖмите — 📊 Получить отчёт',
        '🌙 Завершаем день красиво.\n\nОтметьте прогресс и жмите — 📊 Сформировать отчёт',
        '🌃 Подводим итоги дня.\n\nЗафиксируйте результат и жмите — 📊 Отчёт',
        '🌌 День был продуктивным?\n\nПора это отметить — 📊 Сгенерировать отчёт',
        '🌙 Финальный шаг на сегодня.\n\nОтметьте выполненное и жмите — 📊 Получить отчёт',
        '🌆 Закройте день с результатом.\n\nЖмите — 📊 Сформировать отчёт',
      ],

      uiButtons: {
        openApp: '🚀 Открыть приложение',
        myGoals: '🎯 Мои цели',
        report: '📊 Получить отчёт',
        markGoals: '✅ Отметить цели',
      },

      streakLabelPrefix: 'Серия',
      streakLastChanceText: 'У вас последний шанс сохранить серию!',

      streakWithNum: (num) => `🔥 Серия: ${num} дн.`,
      streakWithNumAndText: (num, text) => `🔥 Серия: ${num} дн.\n\n${text}`,
      streakLastChanceWithNum: (num, randomMessage) =>
        `🔥 Серия: ${num} дн.\n\nУ вас последний шанс сохранить серию!\n\n${randomMessage}`,
    },

    bot2: {
      common: {
        close: '❌ Закрыть',
        support: '💸 Поддержать проект',
      },
      startText:
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
        `Наш телеграмм канал: *@Motivation_bot_channel*`,
      whyText:
        `*🚀 Зачем нужен бот «Дневные достижения»?*\n\n` +
        `Это простой помощник, чтобы *держать дисциплину* и видеть прогресс по целям.\n\n` +
        `*Как это работает:*\n` +
        `1) Вы выбираете цели в приложении *(на 30 / 60 / 120 дней)*\n` +
        `2) Каждый день отмечаете выполнение\n` +
        `3) Бот помогает не забывать и показывает результат\n\n` +
        `*Что вы получаете:*\n` +
        `• 🔥 серию дней (streak), когда вы делаете хотя бы 1 цель в день\n` +
        `• 🏆 очки и достижения за регулярность\n` +
        `• 📊 отчёты по дню / неделе / месяцу\n\n` +
        `Главная идея простая: *маленький шаг каждый день = большой результат со временем*.`,
      seriesText:
        `*🔥 Серия (огонёк) — как начать и не потерять*\n` +
        `\nСерия начинается, когда вы выполняете *2 дня подряд* хотя бы *1 цель*.` +
        `\nДальше серия растёт каждый день, если в этом дне есть хотя бы *1 выполненная цель*.` +
        `\nЕсли пропустить день (нет ни одной выполненной цели) — серия сбрасывается.`,
      newGoalsText:
        `*🎯 Как взять цель в приложении?*\n\n` +
        `Следуйте этим простым шагам 👇\n\n` +
        `1️⃣ Перейдите в раздел *«Цели»*\n` +
        `2️⃣ Откройте вкладку *«Доступные»*\n` +
        `3️⃣ Выберите цель, которую хотите выполнять\n` +
        `4️⃣ Нажмите на неё — откроется окно\n` +
        `5️⃣ Укажите на сколько хотите взять эту цель *(30 / 60 / 120 дней)*\n` +
        `6️⃣ Нажмите кнопку *«Взять цель»*\n\n` +
        `✨ Готово!\n` +
        `Цель появится в разделе *«В процессе»*, и вы сможете отмечать выполнение каждый день.\n\n` +
        `Маленькие действия сегодня → большие результаты завтра 🚀`,
      accomplishmentText:
        `*✅ Как выполнить или отменить выполнение цели?*\n\n` +
        `Есть *два способа* выполнить цель 👇\n\n` +
        `🟢 *Способ 1 — в приложении прямо в списке целей*\n` +
        `Нажмите на цель *один раз* и дождитесь загрузки.\n` +
        `После выполнения рядом появится *зелёная галочка* ✅\n\n` +
        `🔄 *Чтобы отменить выполнение* — нажмите на эту же цель *второй раз* и дождитесь загрузки.\n\n` +
        `📋 *Способ 2 —  в боте*\n` +
        `1️⃣ Найдите в меню или введите самостоятельно команду **/goals**\n` +
        `2️⃣ В сообщении выберите раздел **«В процессе»**\n` +
        `3️⃣ Нажмите на нужные цели\n` +
        `4️⃣ Нажмите кнопку **«Выполнить»**\n\n` +
        `💡 Этот способ удобен, если у вас много активных целей.`,
      deleteGoalsText:
        `*🗑 Как удалить цель?*\n\n` +
        `Если цель больше не актуальна, вы можете удалить её в любой момент 👇\n\n` +
        `📌 *Пошагово:*\n` +
        `1️⃣ Найдите цель, которую хотите удалить\n` +
        `2️⃣ *Зажмите палец* на этой цели и подождите\n` +
        `3️⃣ Внизу появится *красная кнопка* **«Удалить цель»**\n` +
        `4️⃣ Нажмите на неё — цель будет удалена\n\n` +
        `⚠️ *Обратите внимание:* после удаления цели её снова можно будет найти в разделе *Доступные* и взять её а прогресс на ей сохранится.`,
      personalGoalsText:
        `*➕ Как добавить свою личную цель?*\n\n` +
        `Вы можете создать собственную цель, которая будет только у вас 👇\n\n` +
        `📌 *Пошагово:*\n` +
        `1️⃣ Перейдите в раздел с целями\n` +
        `2️⃣ Вверху выберите вкладку **Доступные**\n` +
        `3️⃣ В правом верхнем углу нажмите кнопку **➕**\n` +
        `4️⃣ В открывшемся окне:\n` +
        `   • введите *название цели*\n` +
        `   • выберите *категорию*, к которой она относится\n` +
        `5️⃣ Нажмите **«Добавить»**\n\n` +
        `✅ Готово!\n` +
        `Ваша цель появится в выбранной категории.\n\n` +
        `📍 *Что дальше?*\n` +
        `Теперь возьмите её как обычную цель — через список целей или команду **/newGoals**.`,
      yesterdayText:
        `*⏪ Что делать, если вы забыли отметить цели вчера?*\n\n` +
        `Не переживайте — бот позволяет откатиться на предыдущий день 👇\n\n` +
        `📌 *Как это сделать:*\n` +
        `1️⃣ На главном экране внизу найдите слово **«Откат»** рядом будет кнопка **<**\n` +
        `2️⃣ Нажмите на неё — откроется страница *вчерашних целей*\n` +
        `3️⃣ Выберите нужные цели и:\n` +
        `   • выполните их ✅\n` +
        `   • или отмените выполнение ❌\n\n` +
        `📊 *Отчёт за вчера*\n` +
        `Внизу списка вчерашних целей есть кнопка **«Сгенерировать отчёт»**.\n` +
        `Нажмите её — и бот создаст для вас подробный отчёт за прошлый день.\n\n` +
        `💡 Используйте откат, чтобы сохранять честную статистику и не терять прогресс.`,
      reportText:
        `*📊 Откуда взять дневной/недельный/месяцный отчёт??*\n\n` +
        `Бот автоматически помогает отслеживать ваши достижения на разных промежутках времени 👇\n\n` +
        `🗓 *Дневной отчёт*\n` +
        `На главном экране есть кнопка **«Сгенерировать отчёт»**.\n` +
        `Нажмите на неё — бот создаст отчёт по *сегодняшним целям*.\n` +
        `Вы можете **скопировать текст** и отправить его куда угодно.\n\n` +
        `📅 *Недельный отчёт*\n` +
        `Недельный отчёт **приходит автоматически**.\n` +
        `Бот присылает его **каждое воскресенье в 20:00** ⏰\n` +
        `В нём — ваш прогресс за всю неделю.\n\n` +
        `🗓 *Месячный отчёт*\n` +
        `🚧 В разработке. Скоро станет доступен!\n\n` +
        `💡 Отчёты помогают видеть реальный прогресс и сохранять мотивацию.`,
      achievementsText:
        `*🎖 Как получить ачивку?*\n\n` +
        `1. Выберите ачивку, которую хотите получить.\n` +
        `2. Нажмите на неё — вы увидите её анимацию.\n` +
        `3. Под анимацией будет написано, что нужно сделать, чтобы получить эту ачивку.\n\n` +
        `*⚠ Важно!* Эпические ачивки доступны только в определённый период. После его окончания получить их будет невозможно!\n` +
        `Чтобы не пропустить эпические ачивки, следите за нашими новостями в канале *@Motivation_bot_channel*`,
      historyText:
        `*🎖 Как поделиться ачивкой (историей)*\n\n` +
        `1. Выберите ачивку, которую хотите опубликовать. Обратите внимание: делиться можно только ачивками, которые у вас уже есть.\n` +
        `2. Нажмите на неё — вы увидите её анимацию.\n` +
        `3. Под анимацией появится кнопка *Поделиться / История*. Дождитесь, пока ачивка загрузится, и затем сможете опубликовать её в истории.\n\n` +
        `*⚠ Важно!* Делиться можно только теми ачивками, которые вы действительно имеете.`,
      continuationText:
        `*🚀 Что будет дальше с проектом?*\n\n` +
        `Наши разработчики внимательно прислушиваются к вашим пожеланиям и идеям. У нас уже есть множество классных планов по развитию, и многое зависит от вашей поддержки! 🎯\n\n` +
        `Теперь регулярно будут появляться новые ачивки разных редкостей, так что впереди много интересного! 🏅\n\n` +
        `Наш продукт пока полностью бесплатный, но для дальнейшего развития и расширения проекта нам нужна поддержка. Мы будем очень благодарны за любую помощь — вместе мы сможем сделать проект ещё лучше! ❤️`,
      continuationSupportButton: '💖 Поддержать проект',
      slowdownsText:
        `*🐢 Что делать, если бот или приложение работают медленно?*\n\n` +
        `Если вы заметили задержки или подвисания, попробуйте следующие шаги:\n` +
        `1. Перезапустите бота или приложение.\n` +
        `2. Проверьте VPN — возможно, он включён и замедляет соединение.\n` +
        `3. Убедитесь, что интернет-соединение стабильно.\n\n` +
        `Если это не помогает, подождите немного ⏳. Иногда бот или приложение перегружены из-за большого количества пользователей, и немного времени достаточно, чтобы всё снова работало быстро.`,
      supportCaption:
        `💚 *Поддержка проекта*\n\n` +
        `Если вам нравится бот и приложение — вы можете поддержать развитие проекта.\n\n` +
        `Спасибо, что вы с нами. ❄️`,
      errorSendMessage: '❌ Произошла ошибка при отправке сообщения. Попробуйте позже.',
      errorLoadImage: '❌ Произошла ошибка при загрузке изображения. Попробуйте позже.',
    },
  },

  en: {
    startLanguagePrompt: "Choose the bot's language",
    startWelcomeButtonText: '🚀 Start learning',
    startWelcomeText: (firstName) =>
      `👋 Hi, ${firstName}!\n\n` +
      `This bot will help you:\n` +
      `✅ build discipline\n` +
      `✅ lock in good habits\n` +
      `✅ see your real progress\n\n` +
      `📌 *How it works:*\n` +
      `1️⃣ Choose goals (sport, discipline, etc.)\n` +
      `2️⃣ Mark completion every day\n` +
      `3️⃣ The bot sends reminders\n` +
      `4️⃣ You get points, achievements, and reports\n` +
      `5️⃣ Track your progress in the calendar\n\n` +
      `⏱ Takes only 1–3 minutes a day.\n\n` +
      `📢 Our channel: *@Daily_achievements*\n` +
      `❓ Questions & help: *@keep_alive_Assistant_bot*\n\n` +
      `🚀 *Start now — complete the training*`,

    callbacks: {
      langRuLabel: '🇷🇺 Russian',
      langEnLabel: '🇺🇸 English',
      langRuAnswer: 'Language: Russian',
      langEnAnswer: 'Language: English',
    },

    auth: {
      loadingAuthorization: '⏳ Please wait! Checking authorization.',
    },

    common: {
      close: '❌ Close',
      openApp: '🚀 Open the app',
      openAppGoToMiniApp: 'https://t.me/BotMotivation_TG_bot?startapp=fullscreen',
      myGoals: '🎯 My goals',
      report: '📊 Get the report',
    },

    commands: {
      goals: {
        loading: '⏳ Loading your goals...',
        menuText:
          `📋 *Your goals*\n\n` +
          `Here are all the goals you are working on.\n\n` +
          `🟡 *In progress* — goals you need to complete\n` +
          `✅ *Completed* — goals that are already completed\n\n` +
          `Choose what you want to see:`,
        error: '❌ Failed to load goals, try again later.',
        buttons: {
          inProgress: '🟡 Goals in progress',
          done: '✅ Completed goals',
          close: '❌ Close',
        },
      },

      mini_aps: {
        title: '⚔️ Mini-app *Daily Achievements*\n\n',
      },

      info: {
        text:
          `ℹ️ *About the «Daily Achievements» project*\n\n` +
          `This bot and mini-app help you:\n` +
          `🎯 build useful habits\n` +
          `💪 develop discipline\n` +
          `📈 see real progress\n\n` +
          `📌 *How to use:*\n` +
          `1️⃣ Open the mini-app using the «🚀 Open the app» button\n` +
          `2️⃣ Choose goals for 30, 60, or 120 days\n` +
          `3️⃣ Mark completion every day\n` +
          `4️⃣ Earn points, achievements, and reports\n\n` +
          `📊 *Reports*\n` +
          `• daily — manually\n` +
          `• weekly and monthly — automatically\n` +
          `• with charts and statistics\n\n` +
          `🧭 Use the bot every day.\n` +
          `Even small actions, done regularly,\n` +
          `lead to strong results.\n\n` +
          `❓ Questions & help: *@keep_alive_Assistant_bot*\n` +
          `📢 Project channel: *@Daily_achievements*`,
        close: '❌ Close',
      },

      generate: {
        loading: '⏳ Generating your report...',
        noGoals:
          '😴 There is nothing yet — it is time to act. Take your goals and start moving.',
        error: '❌ Something went wrong while generating the message. Try again.',
      },

      channel: {
        text:
          `BOT & APP NEWS\n\n` +
          `This bot and mini-app are being actively improved and updated.\n\n` +
          `To stay aware of all changes and all the cool features, subscribe to our channel!\n\n` +
          `We post all updates and new features there !!! \n\n` +
          `@Daily_achievements`,
      },

      support: {
        caption:
          `💚 *Project support*\n\n` +
          `If you like the bot and the app, you can support the project’s development.\n\n` +
          `Thank you for being with us. ❄️`,
        supportButton: '💸 Support the project',
      },
    },

    actions: {
      inProgressGoals: {
        loading: '⏳ Loading goals in progress...',
        error: '❌ Failed to load goals.',
        none:
          `No goals in progress.\n` + `Maybe you haven’t taken them or everything is already completed.`,
        text:
          `*Goals in progress*\n\n` +
          `Check the tasks (tap them to set a green checkmark), then press ✅ Done.`,
        buttons: {
          execute: '✅ Done',
          reminder: '📊 Generate the report',
          close: '❌ Close',
        },
      },

      doneGoals: {
        loading: '⏳ Checking completed goals...',
        none: '✅ You have no completed goals today.',
        error: '❌ Failed to load goals.',
        headerWithMsg: (msg) => `✅ Completed goals today:\n\n${msg}`,
        close: '❌ Close',
        noSelected: '⚠️ No goals selected!',
        updateLoading: '⏳ Updating goals...',
        updateError: '❌ Error while updating goals, try again.',
      },

      doneGoalsGeneration: {
        updateLoading: '⏳ Updating goals...',
        generationLoading: '⏳ Generating your report...',
        updateError: '❌ Error while updating goals, try again.',
        success: '✅ Successfully done!',
        seriesStarted: (num) => `Streak started: 🔥 ${num} days.\n\n✅ Successfully done!`,
        seriesContinues: (num) => `🔥 Streak: ${num} days.\n\n✅ Successfully done!`,
      },
    },

    weeklyReport: {
      greeting: (firstName) =>
        `👋 Hi, ${firstName}!\n\n` +
        `The week is over — it’s time to wrap up 🕊\n` +
        `I prepared a report for you 👇`,
      photoCaption: '📈 Goals completion progress for the week',
    },

    reminders: {
      noGoalsInMorningText:
        "You have no goals — maybe you haven’t taken any yet or their execution period has ended ❗️\nOpen the app and take new goals again.",
      noGoalsExpiredText:
        'Your goals execution period has ended ❗️\nOpen the app and take a new goal.',

      morningWithoutGoals: [
        '🌅 Good morning.\n\nToday you can choose a goal and start tracking your progress.',
        '☀️ A new day.\n\nIf you want, open the app and pick a goal for yourself.',
        '🌤 Morning.\n\nA small goal today is a step toward change tomorrow.',
      ],
      morningWithGoals: [
        '🌅 Good morning.\n\nYou have goals today.\nOpen the app and start with your first step.',
        '☀️ The new day has started.\n\nYour goals for today are already waiting for you in the app.',
        '🌤 Morning — time to set the tone for the day.\n\nOpen the app and check your goals for today.',
      ],

      eveningNoGoalsText:
        '🌙 Evening reminder.\n\nYou can choose your goals and start tracking your progress today.',
      eveningAllDoneText:
        '🌙 Perfect day is done.\n\nAll goals are completed — save the result and check today’s report.',

      eveningMessages: [
        '🌇 The day is almost over.\n\nMark what you did and tap — 📊 Generate the report',
        '🌆 Evening is here — time to review.\n\nTap — 📊 Get the report',
        '🌙 Let’s finish the day beautifully.\n\nMark your progress and tap — 📊 Form the report',
        '🌃 Daily wrap-up.\n\nSave the result and tap — 📊 Report',
        '🌌 Was your day productive?\n\nTime to celebrate it — 📊 Generate the report',
        '🌙 Final step for today.\n\nMark what you completed and tap — 📊 Get the report',
        '🌆 Close the day with a result.\n\nTap — 📊 Form the report',
      ],

      uiButtons: {
        openApp: '🚀 Open the app',
        myGoals: '🎯 My goals',
        report: '📊 Get the report',
        markGoals: '✅ Mark goals',
      },

      streakLabelPrefix: 'Streak',
      streakLastChanceText: "This is your last chance to keep the streak!",

      streakWithNum: (num) => `🔥 Streak: ${num} days.`,
      streakWithNumAndText: (num, text) => `🔥 Streak: ${num} days.\n\n${text}`,
      streakLastChanceWithNum: (num, randomMessage) =>
        `🔥 Streak: ${num} days.\n\n${'This is your last chance to keep the streak!'}\n\n${randomMessage}`,
    },

    bot2: {
      common: {
        close: '❌ Close',
        support: '💸 Support the project',
      },
      startText:
        `❓ *Frequently asked questions* ❓\n\n` +
        `DON'T FORGET TO COMPLETE THE TRAINING IN THE APP!\n\n` +
        `If you have any questions about our app or bot, you can find answers here.\n\n` +
        `*Popular questions:*\n` +
        `/why - Why do I need the Daily Achievements bot?\n` +
        `/newGoals - How do I take goals?\n` +
        `/accomplishment - How do I complete or undo a goal?\n` +
        `/deleteGoals - How do I delete a goal?\n` +
        `/personalGoals - How do I add a personal goal?\n` +
        `/yesterday - What if I forgot to mark goals yesterday?\n` +
        `/series - How to start a streak (fire)?\n` +
        `/report - Where can I get daily/weekly/monthly reports?\n` +
        `/achievements - How do I get an achievement?\n` +
        `/history - How do I share an achievement?\n` +
        `/continuation - What's next for the project?\n` +
        `/slowdowns - What to do if the bot or app is slow?\n\n` +
        `If you didn’t find an answer, write in comments in our channel\n` +
        `Our Telegram channel: *@Daily_achievements*`,
      whyText:
        `*🚀 Why do I need the “Daily Achievements” bot?*\n\n` +
        `It is a simple assistant to keep *discipline* and see your progress.\n\n` +
        `*How it works:*\n` +
        `1) You choose goals in the app *(for 30 / 60 / 120 days)*\n` +
        `2) You mark completion every day\n` +
        `3) The bot helps you stay on track and shows results\n\n` +
        `*What you get:*\n` +
        `• 🔥 a streak of days when you complete at least 1 goal per day\n` +
        `• 🏆 points and achievements for consistency\n` +
        `• 📊 reports by day / week / month\n\n` +
        `Main idea: *small step every day = big result over time*.`,
      seriesText:
        `*🔥 Streak — how to start and keep it*\n` +
        `\nA streak starts when you complete *2 days in a row* with at least *1 completed goal*.` +
        `\nThen the streak grows every day if there is at least *1 completed goal* in that day.` +
        `\nIf you skip a day (no completed goals), the streak resets.`,
      newGoalsText:
        `*🎯 How to take a goal in the app?*\n\n` +
        `Follow these simple steps 👇\n\n` +
        `1️⃣ Go to the *“Goals”* section\n` +
        `2️⃣ Open the *“Available”* tab\n` +
        `3️⃣ Choose the goal you want to do\n` +
        `4️⃣ Tap it — a window will open\n` +
        `5️⃣ Choose the duration *(30 / 60 / 120 days)*\n` +
        `6️⃣ Tap *“Take goal”*\n\n` +
        `✨ Done!\n` +
        `The goal will appear in *“In progress”*, and you can mark it daily.\n\n` +
        `Small actions today → big results tomorrow 🚀`,
      accomplishmentText:
        `*✅ How to complete or undo a goal?*\n\n` +
        `There are *two ways* 👇\n\n` +
        `🟢 *Method 1 — in the app goal list*\n` +
        `Tap a goal *once* and wait for loading.\n` +
        `A *green checkmark* will appear when completed ✅\n\n` +
        `🔄 *To undo completion* — tap the same goal *again* and wait for loading.\n\n` +
        `📋 *Method 2 — in the bot*\n` +
        `1️⃣ Use command **/goals**\n` +
        `2️⃣ Choose **“In progress”**\n` +
        `3️⃣ Tap needed goals\n` +
        `4️⃣ Tap **“Complete”**\n\n` +
        `💡 This is useful if you have many active goals.`,
      deleteGoalsText:
        `*🗑 How to delete a goal?*\n\n` +
        `If a goal is no longer relevant, you can delete it anytime 👇\n\n` +
        `📌 *Step by step:*\n` +
        `1️⃣ Find the goal you want to delete\n` +
        `2️⃣ *Long press* on it\n` +
        `3️⃣ A red **“Delete goal”** button appears\n` +
        `4️⃣ Tap it — goal is deleted\n\n` +
        `⚠️ *Note:* after deletion you can find it again in *Available* and take it, and progress stays saved.`,
      personalGoalsText:
        `*➕ How to add your own goal?*\n\n` +
        `You can create a personal goal visible only to you 👇\n\n` +
        `📌 *Step by step:*\n` +
        `1️⃣ Go to goals section\n` +
        `2️⃣ Open **Available** tab\n` +
        `3️⃣ Tap **➕** in top-right corner\n` +
        `4️⃣ In the opened window:\n` +
        `   • enter *goal name*\n` +
        `   • choose *category*\n` +
        `5️⃣ Tap **“Add”**\n\n` +
        `✅ Done!\n` +
        `Your goal will appear in selected category.\n\n` +
        `📍 *What next?*\n` +
        `Take it like any regular goal — via list or **/newGoals**.`,
      yesterdayText:
        `*⏪ What if you forgot to mark goals yesterday?*\n\n` +
        `No worries — bot lets you roll back to previous day 👇\n\n` +
        `📌 *How to do it:*\n` +
        `1️⃣ On home screen find **“Rollback”** with **<** button\n` +
        `2️⃣ Tap it — yesterday goals page opens\n` +
        `3️⃣ Select goals and:\n` +
        `   • complete them ✅\n` +
        `   • or undo completion ❌\n\n` +
        `📊 *Yesterday report*\n` +
        `At the bottom there is **“Generate report”**.\n` +
        `Tap it — bot creates a detailed report for previous day.\n\n` +
        `💡 Use rollback to keep fair stats and not lose progress.`,
      reportText:
        `*📊 Where to get daily/weekly/monthly reports?*\n\n` +
        `The bot helps track your achievements across different periods 👇\n\n` +
        `🗓 *Daily report*\n` +
        `On home screen there is **“Generate report”** button.\n` +
        `Tap it — bot creates a report for *today’s goals*.\n` +
        `You can **copy text** and share anywhere.\n\n` +
        `📅 *Weekly report*\n` +
        `Weekly report arrives **automatically**.\n` +
        `Bot sends it **every Sunday at 20:00** ⏰\n` +
        `It shows your weekly progress.\n\n` +
        `🗓 *Monthly report*\n` +
        `🚧 In development. Coming soon!\n\n` +
        `💡 Reports help you see real progress and keep motivation.`,
      achievementsText:
        `*🎖 How to get an achievement?*\n\n` +
        `1. Choose the achievement you want.\n` +
        `2. Tap it — you will see its animation.\n` +
        `3. Under animation you'll see what to do to get it.\n\n` +
        `*⚠ Important!* Epic achievements are available only during a specific period. After it ends, they cannot be obtained!\n` +
        `To not miss epic achievements, follow our channel *@Daily_achievements*`,
      historyText:
        `*🎖 How to share an achievement (story)*\n\n` +
        `1. Choose an achievement you want to publish. You can only share achievements you already have.\n` +
        `2. Tap it — you’ll see animation.\n` +
        `3. Under animation there will be *Share / Story* button. Wait for loading and then publish to stories.\n\n` +
        `*⚠ Important!* You can share only achievements you actually own.`,
      continuationText:
        `*🚀 What’s next for the project?*\n\n` +
        `Our developers carefully listen to your ideas. We already have many cool development plans, and your support matters a lot! 🎯\n\n` +
        `New achievements of different rarities will appear regularly, so lots of interesting things are ahead! 🏅\n\n` +
        `Our product is still fully free, but we need support for further growth. We’ll be grateful for any help — together we can make it even better! ❤️`,
      continuationSupportButton: '💖 Support the project',
      slowdownsText:
        `*🐢 What to do if the bot or app is slow?*\n\n` +
        `If you see lags or freezes, try these steps:\n` +
        `1. Restart bot or app.\n` +
        `2. Check VPN — it may be enabled and slowing connection.\n` +
        `3. Make sure internet is stable.\n\n` +
        `If it still happens, wait a bit ⏳. Sometimes bot/app are overloaded due to many users, and a short delay is enough.`,
      supportCaption:
        `💚 *Project support*\n\n` +
        `If you like the bot and app, you can support project development.\n\n` +
        `Thank you for being with us. ❄️`,
      errorSendMessage: '❌ Error while sending message. Please try again later.',
      errorLoadImage: '❌ Error while loading image. Please try again later.',
    },
  },
};


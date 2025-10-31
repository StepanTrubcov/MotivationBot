import axios from 'axios';

const BASE_URL = 'https://motivation-oz64.vercel.app/api';

//логинизация
export const addProfile = async (ctx) => {

  const userData = {
    id: ctx.from.id,
    first_name: ctx.from.first_name,
    username: ctx.from.username,
    photo_url: null,
  };

  console.log(userData)

  let attempts = 0;
  const maxAttempts = 3;
  try {
    const postResponse = await axios.post(`${BASE_URL}/users`, {
      telegramId: userData.id,
      firstName: userData.first_name,
      username: userData.username,
      photoUrl: userData.photo_url
    });

    return postResponse.data;
  } catch (error) {
    attempts++;
    console.error(`Попытка ${attempts} не удалась:`, {
      message: error.message,
      response: error.response ? error.response.data : null,
      status: error.response ? error.response.status : null
    });

    if (attempts >= maxAttempts) {
      console.error("Все попытки создания профиля провалились");
      return null;
    }
  }
}

// изменения статуса цели 
export async function getAllStatus(customUserId, goalId, newStatus) {
  if (!customUserId || !goalId || !newStatus) {
    console.error(`Invalid parameters: customUserId=${customUserId}, goalId=${goalId}, newStatus=${newStatus}`);
    throw new Error("customUserId, goalId, and newStatus are required");
  }

  console.log(`Updating status for goal ${goalId} to ${newStatus} for user ${customUserId}`);
  try {
    await axios.put(`${BASE_URL}/goals/${customUserId}/${goalId}`, { newStatus });
    console.log(`Статус цели ${goalId} для пользователя ${customUserId} изменён на ${newStatus}`);

  } catch (error) {
    toast.error("Не удалось взять цель. Попробуйте снова.");
    console.error(`Ошибка обновления статуса цели ${goalId}:`, error);
    throw error;
  }
}

//получение целей
const getAllGoals = async (userId) => {
  if (!userId) throw new Error('userId is required');
  try {
    const { data } = await axios.get(`${BASE_URL}/goals/${userId}`);
    return data;
  } catch (error) {
    console.error('Ошибка получения целей:', error.response?.data || error.message);
    throw error;
  }
};

//проверка времени целей
export async function checkGoalCompletion(customUserId) {
  if (!customUserId) {
    console.error("customUserId is undefined in checkGoalCompletion");
    throw new Error("customUserId is required");
  }
  try {
    const response = await axios.post(`${BASE_URL}/check-completion/${customUserId}`);
    return response.data;
  } catch (error) {
    console.error("Ошибка проверки завершения целей:", error);
    throw error;
  }
}

//проверка целей
export async function initializeUserGoals(customUserId) {
  if (!customUserId) {
    console.error("customUserId is undefined in initializeUserGoals");
    throw new Error("customUserId is required");
  }

  console.log('Initializing goals for user:', customUserId);

  const goalsArray = [
    // === SPORT ===
    { id: "1", title: "Пробежать 1 км", points: 10, status: "not_started", category: "Sport", completionDate: null, description: "Пробегайте по 1 км каждый день на протяжении 30 дней. Это укрепит сердце и повысит выносливость.", userId: customUserId, progress: 0 },
    { id: "3", title: "Пробежать 5 км", points: 20, status: "not_started", category: "Sport", completionDate: null, description: "Пробегайте по 5 км несколько раз в неделю. Это укрепит сердце и мышцы.", userId: customUserId, progress: 0 },
    { id: "5", title: "Сделать 50 приседаний", points: 25, status: "not_started", category: "Sport", completionDate: null, description: "Ежедневно делайте по 50 приседаний для укрепления ног и ягодиц.", userId: customUserId, progress: 0 },
    { id: "8", title: "Сделать 20 отжиманий", points: 15, status: "not_started", category: "Sport", completionDate: null, description: "Отжимайтесь ежедневно для укрепления мышц груди и рук.", userId: customUserId, progress: 0 },
    { id: "14", title: "Пройти 5000 шагов", points: 20, status: "not_started", category: "Sport", completionDate: null, description: "Проходите 5000 шагов ежедневно. Это поддержит здоровье и тонус.", userId: customUserId, progress: 0 },
    { id: "18", title: "Утренняя зарядка 10 минут", points: 15, status: "not_started", category: "Sport", completionDate: null, description: "Делайте утреннюю зарядку для энергии на день.", userId: customUserId, progress: 0 },
    { id: "25", title: "Сделать планку 1 минуту", points: 20, status: "not_started", category: "Sport", completionDate: null, description: "Держите планку по 1 минуте ежедневно. Это укрепит мышцы кора.", userId: customUserId, progress: 0 },
    { id: "49", title: "Сделать 15 минут йоги", points: 20, status: "not_started", category: "Sport", completionDate: null, description: "Практикуйте йогу ежедневно для гибкости и спокойствия.", userId: customUserId, progress: 0 },
    { id: "51", title: "Пройти пешком на работу", points: 15, status: "not_started", category: "Sport", completionDate: null, description: "Замените транспорт пешей прогулкой — заряд бодрости на день.", userId: customUserId, progress: 0 },
    { id: "52", title: "Покататься на велосипеде 30 минут", points: 20, status: "not_started", category: "Sport", completionDate: null, description: "Катайтесь на велосипеде для здоровья и удовольствия.", userId: customUserId, progress: 0 },
    { id: "61", title: "Сделать растяжку 10 минут", points: 15, status: "not_started", category: "Sport", completionDate: null, description: "Растягивайтесь ежедневно для гибкости и здоровья суставов.", userId: customUserId, progress: 0 },
    { id: "62", title: "Сделать 200 прыжков на скакалке", points: 25, status: "not_started", category: "Sport", completionDate: null, description: "Прыжки на скакалке улучшают координацию и кардио.", userId: customUserId, progress: 0 },
    { id: "63", title: "Погулять 30 минут на свежем воздухе", points: 10, status: "not_started", category: "Sport", completionDate: null, description: "Прогулка помогает снять стресс и улучшает настроение.", userId: customUserId, progress: 0 },
    { id: "64", title: "Сделать разминку перед началом дня", points: 10, status: "not_started", category: "Sport", completionDate: null, description: "Небольшая разминка активирует мышцы и улучшает кровообращение.", userId: customUserId, progress: 0 },
    { id: "65", title: "Сделать растяжку после сна", points: 10, status: "not_started", category: "Sport", completionDate: null, description: "Мягко разомните тело после сна для энергии и гибкости.", userId: customUserId, progress: 0 },

    // === DISCIPLINE ===
    { id: "4", title: "Кодить 1 час за ноутбуком", points: 30, status: "not_started", category: "Discipline", completionDate: null, description: "Программируйте ежедневно для развития дисциплины и навыков.", userId: customUserId, progress: 0 },
    { id: "16", title: "Облиться холодной водой", points: 15, status: "not_started", category: "Discipline", completionDate: null, description: "Закаляйтесь холодной водой для укрепления духа и тела.", userId: customUserId, progress: 0 },
    { id: "35", title: "Лечь спать до 23:00", points: 25, status: "not_started", category: "Discipline", completionDate: null, description: "Соблюдайте режим сна для восстановления энергии.", userId: customUserId, progress: 0 },
    { id: "36", title: "Рано проснуться", points: 20, status: "not_started", category: "Discipline", completionDate: null, description: "Начинайте день рано — для продуктивности и спокойствия.", userId: customUserId, progress: 0 },
    { id: "45", title: "2 часа без телефона", points: 30, status: "not_started", category: "Discipline", completionDate: null, description: "Отложите телефон, чтобы сосредоточиться на важных делах.", userId: customUserId, progress: 0 },
    { id: "54", title: "Составить распорядок дня", points: 20, status: "not_started", category: "Discipline", completionDate: null, description: "Распланируйте свой день и следуйте плану.", userId: customUserId, progress: 0 },
    { id: "66", title: "Убрать рабочее место", points: 10, status: "not_started", category: "Discipline", completionDate: null, description: "Поддерживайте порядок на столе — это помогает концентрации.", userId: customUserId, progress: 0 },
    { id: "68", title: "Провести день без сладкого", points: 25, status: "not_started", category: "Discipline", completionDate: null, description: "Контролируйте свои привычки и укрепляйте дисциплину.", userId: customUserId, progress: 0 },
    { id: "69", title: "Поработать 2 часа без отвлечений", points: 25, status: "not_started", category: "Discipline", completionDate: null, description: "Сосредоточьтесь на задаче и не переключайтесь.", userId: customUserId, progress: 0 },
    { id: "70", title: "Проснуться без телефона в руках", points: 15, status: "not_started", category: "Discipline", completionDate: null, description: "Начните утро без гаджетов для чистого фокуса.", userId: customUserId, progress: 0 },

    // === SELF_DEVELOPMENT ===
    { id: "2", title: "Читать книгу 20 минут", points: 20, status: "not_started", category: "Self_development", completionDate: null, description: "Читайте ежедневно для развития мышления и внимания.", userId: customUserId, progress: 0 },
    { id: "6", title: "Учить английский", points: 20, status: "not_started", category: "Self_development", completionDate: null, description: "Учите новые английские слова ежедневно.", userId: customUserId, progress: 0 },
    { id: "13", title: "Поработать над стартапом", points: 20, status: "not_started", category: "Self_development", completionDate: null, description: "Развивайте свои идеи и продвигайте личные проекты.", userId: customUserId, progress: 0 },
    { id: "24", title: "Смотреть обучающее видео", points: 15, status: "not_started", category: "Self_development", completionDate: null, description: "Смотрите обучающие материалы для роста.", userId: customUserId, progress: 0 },
    { id: "34", title: "Выучить 20 английских слов", points: 40, status: "not_started", category: "Self_development", completionDate: null, description: "Пополняйте словарный запас каждый день.", userId: customUserId, progress: 0 },
    { id: "47", title: "Прочитать статью о саморазвитии", points: 10, status: "not_started", category: "Self_development", completionDate: null, description: "Читайте статьи о личностном росте ежедневно.", userId: customUserId, progress: 0 },
    { id: "55", title: "Прослушать подкаст о личностном росте", points: 15, status: "not_started", category: "Self_development", completionDate: null, description: "Слушайте полезные подкасты о саморазвитии.", userId: customUserId, progress: 0 },
    { id: "71", title: "Посмотреть документальный фильм", points: 20, status: "not_started", category: "Self_development", completionDate: null, description: "Расширяйте кругозор, изучая новые темы.", userId: customUserId, progress: 0 },
    { id: "72", title: "Записать 3 идеи для улучшения жизни", points: 15, status: "not_started", category: "Self_development", completionDate: null, description: "Ежедневно фиксируйте идеи и наблюдения.", userId: customUserId, progress: 0 },
    { id: "73", title: "Вести дневник благодарности", points: 10, status: "not_started", category: "Self_development", completionDate: null, description: "Каждый вечер записывайте 3 вещи, за которые благодарны.", userId: customUserId, progress: 0 },
    { id: "74", title: "Научиться новому навыку 30 минут", points: 25, status: "not_started", category: "Self_development", completionDate: null, description: "Ежедневно осваивайте хоть что-то новое.", userId: customUserId, progress: 0 },
    { id: "75", title: "Придумать цель на завтра", points: 10, status: "not_started", category: "Self_development", completionDate: null, description: "Планируйте следующий день заранее для ясности и фокуса.", userId: customUserId, progress: 0 },

    // === SPIRITUALITY === (оставлены как у тебя)
    { id: "57", title: "Прочитать одну главу Евангелия", points: 20, status: "not_started", category: "Spirituality", completionDate: null, description: "Читайте ежедневно одну главу Евангелия для укрепления веры.", userId: customUserId, progress: 0 },
    { id: "58", title: "Помолиться утром и вечером", points: 15, status: "not_started", category: "Spirituality", completionDate: null, description: "Начинайте и завершайте день молитвой и благодарностью.", userId: customUserId, progress: 0 },
    { id: "60", title: "Прочитать молитву перед сном", points: 10, status: "not_started", category: "Spirituality", completionDate: null, description: "Завершайте день молитвой, осмысливая прожитое.", userId: customUserId, progress: 0 },
  ];


  try {
    const existingGoals = await getAllGoals(customUserId);
    
    // Проверяем, есть ли уже цели у пользователя
    if (existingGoals && existingGoals.length > 0) {
      console.log(`✅ У пользователя ${customUserId} уже есть ${existingGoals.length} целей. Пропускаем инициализацию.`);
      return false;
    }

    console.log(`📤 Отправка ${goalsArray.length} целей на сервер...`);
    const response = await axios.post(`${BASE_URL}/initialize-goals/${customUserId}`, {
      goalsArray
    });

    console.log('✅ Цели успешно инициализированы:', response.data);
    return true;
  } catch (error) {
    console.error("❌ Ошибка инициализации целей:", error);
    throw error;
  }
}

//добавление очков
export async function addPoints(customUserId, points) {
  try {
    const response = await axios.post(`${BASE_URL}/users/${customUserId}/pts/increment`, {
      amount: points
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка добавления очков:", error);
    throw error;
  }
}

//добавление даты для календаря
export async function addCompletedDate(customUserId, date) {
  if (!customUserId || !date) {
    throw new Error("customUserId и date обязательны");
  }

  try {
    const response = await axios.post(`${BASE_URL}/users/${customUserId}/completed-dates`, { date });
    return response.data;
  } catch (error) {
    console.error("Ошибка добавления даты:", error);
    throw error;
  }
}

//генерация текста
export const getGeneraleText = async (telegramId, goalsDone, goalsInProgress) => {
  try {
    if (!telegramId) {
      console.error("❌ Нет telegramId для отчёта");
      return;
    }
    const response = await axios.post(`${BASE_URL}/generate-report/${telegramId}`, {
      goalsDone,
      goalsInProgress,
    });

    const { message, success } = response.data;

    return message;
  } catch (err) {
    console.error("❌ Ошибка при генерации отчёта:", err);
    toast.error("Произошла ошибка при создании отчёта");
  }
};
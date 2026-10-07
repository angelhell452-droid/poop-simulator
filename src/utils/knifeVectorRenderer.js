/**
 * knifeVectorRenderer.js
 * Универсальный векторный рендерер для 19 типов ножей и их скинов:
 * karambit, butterfly, m9, bayonet, flip, gut, falchion, huntsman, bowie, stiletto,
 * navaja, ursus, talon, paracord, survival, nomad, classic, katana, scythe (+ daggers, skeleton).
 * 
 * Предоставляет:
 * 1. getKnifeSvg(knife, size, options) — чистый масштабируемый SVG для UI (рулетка, инвентарь, атлас)
 * 2. drawKnifeOnCanvas(ctx, knife, time) — отрисовка ножа в лапке какашки с анимацией и шейдерами
 */

// Градиенты и стили скинов для SVG (<defs>)
export function getKnifeSkinDefs(gradientId, bladeColor) {
  const color = (bladeColor || '').toLowerCase().trim();

  if (color === 'fade') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#facc15" />
        <stop offset="35%" stop-color="#f43f5e" />
        <stop offset="70%" stop-color="#a855f7" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>`;
  }
  if (color === 'marble' || color === 'fire_ice') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="80%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="50%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="${color === 'fire_ice' ? '#06b6d4' : '#eab308'}" />
      </linearGradient>`;
  }
  if (color === 'lore') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="45%" stop-color="#eab308" />
        <stop offset="100%" stop-color="#ca8a04" />
      </linearGradient>`;
  }
  if (color === 'ruby' || color === 'doppler_pink') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fda4af" />
        <stop offset="40%" stop-color="#e11d48" />
        <stop offset="100%" stop-color="#881337" />
      </linearGradient>`;
  }
  if (color === 'sapphire' || color === 'doppler_blue') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7dd3fc" />
        <stop offset="40%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#082f49" />
      </linearGradient>`;
  }
  if (color === 'emerald') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#86efac" />
        <stop offset="40%" stop-color="#16a34a" />
        <stop offset="100%" stop-color="#052e16" />
      </linearGradient>`;
  }
  if (color === 'bluegem') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="60%" stop-color="#0369a1" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>`;
  }
  if (color === 'tiger') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="35%" stop-color="#f59e0b" />
        <stop offset="70%" stop-color="#b45309" />
        <stop offset="100%" stop-color="#78350f" />
      </linearGradient>`;
  }
  if (color === 'slaughter' || color === 'crimson') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f87171" />
        <stop offset="50%" stop-color="#dc2626" />
        <stop offset="100%" stop-color="#7f1d1d" />
      </linearGradient>`;
  }
  if (color === 'autotronic') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="65%" stop-color="#b91c1c" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>`;
  }
  if (color === 'damascus') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="25%" stop-color="#94a3b8" />
        <stop offset="50%" stop-color="#f1f5f9" />
        <stop offset="75%" stop-color="#64748b" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>`;
  }
  if (color === 'hyper') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22d3ee" />
        <stop offset="35%" stop-color="#ec4899" />
        <stop offset="70%" stop-color="#a855f7" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>`;
  }
  if (color === 'printstream') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#e2e8f0" />
        <stop offset="85%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>`;
  }
  if (color === 'rainbow') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="20%" stop-color="#f97316" />
        <stop offset="40%" stop-color="#eab308" />
        <stop offset="60%" stop-color="#22c55e" />
        <stop offset="80%" stop-color="#06b6d4" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>`;
  }
  if (color === 'celestial') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a5f3fc" />
        <stop offset="40%" stop-color="#06b6d4" />
        <stop offset="75%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>`;
  }
  if (color === 'titanium') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e0f2fe" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </linearGradient>`;
  }
  if (color === 'godly') {
    return `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="35%" stop-color="#fbbf24" />
        <stop offset="70%" stop-color="#b45309" />
        <stop offset="100%" stop-color="#312e81" />
      </linearGradient>`;
  }

  // Обычный сплошной цвет или HEX
  return '';
}

// Получить заливку для SVG (url(#id) или hex)
export function getSvgBladeFill(bladeColor, gradientId) {
  const defs = getKnifeSkinDefs(gradientId, bladeColor);
  if (defs) return `url(#${gradientId})`;
  return bladeColor || '#94a3b8';
}

// ─── ВЕКТОРНАЯ ГЕОМЕТРИЯ ДЛЯ 19 ТИПОВ НОЖЕЙ (Вьюбокс: 0 0 100 60) ─────────────
export function getKnifeVectorSvgPaths(style, bladeFill, handleColor = '#27272a') {
  const hc = handleColor || '#27272a';

  switch (style) {
    case 'karambit':
      return `
        <!-- Karambit: Изогнутый коготь тигра с кольцом под палец -->
        <circle cx="20" cy="38" r="8" fill="none" stroke="${hc}" stroke-width="4.5" />
        <circle cx="20" cy="38" r="4.5" fill="#0f172a" />
        <!-- Рукоять с анатомическими выемками -->
        <path d="M 26 34 L 46 29 C 48 33 46 39 42 42 L 24 45 Z" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Защитная насечка -->
        <line x1="32" y1="31" x2="33" y2="40" stroke="#475569" stroke-width="1.2" />
        <line x1="38" y1="30" x2="39" y2="38" stroke="#475569" stroke-width="1.2" />
        <!-- Изогнутый хищный клинок -->
        <path d="M 46 29 Q 72 20 86 42 Q 62 33 42 42 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <!-- Ребро жесткости / блик -->
        <path d="M 48 30 Q 68 24 80 40" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
      `;

    case 'talon':
      return `
        <!-- Talon: Серповидный нож с зубьями на обухе и кольцом слоновой кости -->
        <circle cx="19" cy="38" r="8.5" fill="none" stroke="${hc}" stroke-width="4.5" />
        <circle cx="19" cy="38" r="4.5" fill="#0f172a" />
        <!-- Рукоять цвета слоновой кости / карбона -->
        <path d="M 25 34 L 46 28 C 49 33 47 40 43 43 L 23 45 Z" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Зубцы на обухе -->
        <polygon points="50,26 53,24 54,27" fill="${bladeFill}" />
        <polygon points="56,24 59,22 60,25" fill="${bladeFill}" />
        <polygon points="62,23 65,21 66,24" fill="${bladeFill}" />
        <!-- Серповидный клинок -->
        <path d="M 46 28 Q 72 17 88 40 Q 64 33 43 43 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <path d="M 48 29 Q 68 22 82 37" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1.2" />
      `;

    case 'butterfly':
      return `
        <!-- Butterfly (Балисонг): Раздельные рукояти и штифты -->
        <!-- Верхняя рукоять -->
        <rect x="12" y="21" width="30" height="6.5" rx="3" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Нижняя рукоять -->
        <rect x="12" y="32" width="30" height="6.5" rx="3" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Декоративные отверстия рукояти -->
        <circle cx="20" cy="24" r="1.5" fill="#0f172a" />
        <circle cx="28" cy="24" r="1.5" fill="#0f172a" />
        <circle cx="20" cy="35" r="1.5" fill="#0f172a" />
        <circle cx="28" cy="35" r="1.5" fill="#0f172a" />
        <!-- Латунные шарниры -->
        <circle cx="41" cy="24" r="2.2" fill="#e2e8f0" stroke="#09090b" stroke-width="1" />
        <circle cx="41" cy="35" r="2.2" fill="#e2e8f0" stroke="#09090b" stroke-width="1" />
        <!-- Клинок Балисонга (обоюдоострый штык) -->
        <path d="M 42 27 L 78 28 L 88 30 L 78 32 L 42 33 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <line x1="44" y1="30" x2="84" y2="30" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
      `;

    case 'm9':
      return `
        <!-- M9 Bayonet: Широкая армейская гарда с кольцом под ствол и зубьями-пилой -->
        <!-- Рукоять с текстурой рифления -->
        <rect x="12" y="26" width="28" height="9" rx="2" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <line x1="18" y1="26" x2="18" y2="35" stroke="#475569" stroke-width="1.2" />
        <line x1="24" y1="26" x2="24" y2="35" stroke="#475569" stroke-width="1.2" />
        <line x1="30" y1="26" x2="30" y2="35" stroke="#475569" stroke-width="1.2" />
        <!-- Массивная гарда с дульным кольцом -->
        <rect x="40" y="20" width="5" height="21" rx="1.5" fill="#64748b" stroke="#09090b" stroke-width="1.5" />
        <circle cx="42.5" cy="22.5" r="2.2" fill="#0f172a" />
        <!-- Пила на обухе -->
        <path d="M 48 25 L 51 22 L 53 25 L 56 22 L 58 25 L 61 22 L 63 25 L 66 22 L 68 25" fill="none" stroke="#09090b" stroke-width="1.5" />
        <!-- Мощный армейский клинок -->
        <path d="M 45 25 L 75 25 L 88 31 L 74 36 L 45 36 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <!-- Дол (кровосток) -->
        <line x1="50" y1="30.5" x2="72" y2="30.5" stroke="#334155" stroke-width="2" stroke-linecap="round" />
        <line x1="50" y1="30" x2="72" y2="30" stroke="rgba(255,255,255,0.7)" stroke-width="1" stroke-linecap="round" />
      `;

    case 'bayonet':
      return `
        <!-- Штык-нож (Bayonet): Классический прямой штык с длинным долом -->
        <rect x="14" y="26" width="27" height="8.5" rx="2" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <rect x="41" y="21" width="4.5" height="19" rx="1.5" fill="#52525b" stroke="#09090b" stroke-width="1.5" />
        <!-- Прямой штыковой клинок -->
        <path d="M 45.5 26 L 76 26 L 87 30 L 75 35 L 45.5 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <line x1="50" y1="30" x2="74" y2="30" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
        <line x1="50" y1="29.5" x2="74" y2="29.5" stroke="rgba(255,255,255,0.7)" stroke-width="0.9" />
      `;

    case 'flip':
      return `
        <!-- Flip Knife: Изогнутый складной клинок с плавником (флиппером) -->
        <path d="M 16 32 C 16 26 28 26 44 28 C 45 34 38 38 22 38 Z" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Осевой винт -->
        <circle cx="43" cy="31" r="2.5" fill="#94a3b8" stroke="#0f172a" stroke-width="1" />
        <!-- Флиппер (плавник) -->
        <polygon points="44,35 48,37 46,33" fill="${bladeFill}" stroke="#09090b" stroke-width="1" />
        <!-- Изогнутое серповидное лезвие -->
        <path d="M 44 28 Q 66 23 85 27 Q 68 36 46 33 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <path d="M 46 29 Q 66 25 81 28" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
      `;

    case 'gut':
      return `
        <!-- Gut Knife: Массивный клинок со шкуродёрным крюком на конце -->
        <rect x="14" y="27" width="28" height="9" rx="3" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Заклёпки на дереве/рукояти -->
        <circle cx="21" cy="31.5" r="1.5" fill="#fcd34d" />
        <circle cx="34" cy="31.5" r="1.5" fill="#fcd34d" />
        <!-- Широкое брюшко и шкуродёрный крюк -->
        <path d="M 42 27 L 72 27 Q 78 27 82 23 Q 86 20 84 26 L 80 29 Q 74 39 42 36 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <!-- Заточка крюка -->
        <path d="M 77 24 Q 82 22 81 26" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.4" />
      `;

    case 'falchion':
      return `
        <!-- Falchion: Клинок в восточном стиле с расширением к кончику -->
        <path d="M 15 33 L 42 30 C 44 35 38 39 20 38 Z" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <circle cx="41" cy="32" r="2.2" fill="#cbd5e1" stroke="#0f172a" stroke-width="1" />
        <!-- Расширяющееся лезвие Фальшиона -->
        <path d="M 42 30 Q 64 27 75 22 L 87 26 Q 74 38 43 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <path d="M 44 31 Q 65 28 83 27" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
      `;

    case 'huntsman':
      return `
        <!-- Huntsman: Тактический нож выживания с шоковыми зубьями и танто-остриём -->
        <path d="M 15 26 L 41 26 L 40 37 L 18 36 Z" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Зубья на обухе -->
        <polygon points="46,24 49,21 51,24" fill="${bladeFill}" />
        <polygon points="53,24 56,21 58,24" fill="${bladeFill}" />
        <polygon points="60,24 63,21 65,24" fill="${bladeFill}" />
        <!-- Рубленое остриё Танто -->
        <path d="M 41 24 L 70 24 L 86 31 L 76 37 L 40 37 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <line x1="70" y1="24" x2="76" y2="37" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" />
      `;

    case 'bowie':
      return `
        <!-- Bowie Knife: Огромный тесак с глубоким скосом обуха Clip-Point -->
        <rect x="12" y="27" width="28" height="9" rx="2.5" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <rect x="40" y="20" width="4" height="23" rx="1.2" fill="#d97706" stroke="#09090b" stroke-width="1.5" />
        <!-- Клип-пойнт и широкое лезвие Боуи -->
        <path d="M 44 26 L 68 26 Q 78 27 88 32 Q 74 41 44 37 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <path d="M 68 26 Q 78 27 88 32" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.4" />
      `;

    case 'stiletto':
      return `
        <!-- Stiletto: Тонкий итальянский стилет-игла с крестовиной -->
        <rect x="14" y="28.5" width="28" height="5.5" rx="1.5" fill="${hc}" stroke="#0f172a" stroke-width="1.2" />
        <!-- Кнопка выброса -->
        <circle cx="36" cy="31" r="1.8" fill="#f59e0b" stroke="#0f172a" stroke-width="0.8" />
        <!-- Крестовина (гарда) -->
        <polygon points="42,23 44,23 44,39 42,39" fill="#94a3b8" stroke="#09090b" stroke-width="1" />
        <!-- Узкий игольчатый клинок -->
        <path d="M 44 29.5 L 89 31 L 44 32.5 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.2" />
        <line x1="45" y1="31" x2="87" y2="31" stroke="rgba(255,255,255,0.8)" stroke-width="1" />
      `;

    case 'navaja':
      return `
        <!-- Navaja: Традиционная испанская складная наваха с изогнутой рукоятью -->
        <path d="M 14 36 Q 28 36 43 32 C 43 36 34 40 18 40 Z" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <circle cx="41" cy="33.5" r="2" fill="#fcd34d" stroke="#0f172a" stroke-width="1" />
        <!-- Клинок навахи листовидной формы -->
        <path d="M 43 32 Q 62 26 82 28 Q 66 38 44 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <path d="M 45 32 Q 64 28 78 29" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" />
      `;

    case 'ursus':
      return `
        <!-- Ursus: Простой и надёжный нож Танто с граненой рукоятью -->
        <rect x="14" y="26.5" width="29" height="8.5" rx="1.5" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Клинок Танто с прямым обухом -->
        <path d="M 43 26.5 L 72 26.5 L 86 32 L 72 35 L 43 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <line x1="72" y1="26.5" x2="72" y2="35" stroke="#334155" stroke-width="1.4" />
        <line x1="45" y1="28" x2="80" y2="31" stroke="rgba(255,255,255,0.65)" stroke-width="1" />
      `;

    case 'paracord':
      return `
        <!-- Paracord: Скелетная рукоять, оплетённая тактическим шнуром паракорда -->
        <rect x="14" y="27" width="28" height="8" rx="2" fill="#1e293b" stroke="#09090b" stroke-width="1.5" />
        <!-- Витки оранжевого / хаки паракорда -->
        <line x1="18" y1="27" x2="22" y2="35" stroke="#ea580c" stroke-width="2.2" />
        <line x1="24" y1="27" x2="28" y2="35" stroke="#ea580c" stroke-width="2.2" />
        <line x1="30" y1="27" x2="34" y2="35" stroke="#ea580c" stroke-width="2.2" />
        <line x1="36" y1="27" x2="40" y2="35" stroke="#ea580c" stroke-width="2.2" />
        <!-- Клинок Drop Point с отверстием -->
        <path d="M 42 27 L 74 27 Q 85 29 87 32 Q 76 36 42 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <circle cx="50" cy="31" r="2.2" fill="#0f172a" />
      `;

    case 'survival':
      return `
        <!-- Survival: Нож для выживания со стропорезом и пилой -->
        <rect x="14" y="26.5" width="28" height="8.5" rx="2" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <!-- Пила на обухе -->
        <polygon points="46,24.5 48,22 50,24.5" fill="${bladeFill}" />
        <polygon points="52,24.5 54,22 56,24.5" fill="${bladeFill}" />
        <polygon points="58,24.5 60,22 62,24.5" fill="${bladeFill}" />
        <!-- Стропорезный вырез -->
        <path d="M 42 24.5 L 66 24.5 Q 70 20 73 24.5 L 86 30 Q 75 36 42 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
      `;

    case 'nomad':
      return `
        <!-- Nomad: Мощный складной полевой нож с продольным отверстием -->
        <path d="M 14 33 L 42 29 C 45 35 39 39 20 38 Z" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <circle cx="41" cy="31" r="2.2" fill="#94a3b8" />
        <!-- Широкий клинок с длинным пропилом -->
        <path d="M 42 29 Q 65 24 85 29 Q 70 37 43 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <!-- Овальное отверстие на обухе -->
        <rect x="52" y="28" width="14" height="2.2" rx="1.1" fill="#0f172a" />
      `;

    case 'classic':
      return `
        <!-- Classic Knife: Легендарный нож из CS 1.6 / Source -->
        <rect x="14" y="27" width="27" height="8" rx="2" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <rect x="41" y="23" width="3.5" height="16" rx="1" fill="#cbd5e1" stroke="#09090b" stroke-width="1.2" />
        <!-- Клиссическое лезвие CS 1.6 -->
        <path d="M 44.5 27 L 72 27 L 85 31 Q 72 36 44.5 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <line x1="48" y1="30" x2="72" y2="30" stroke="#475569" stroke-width="1.4" stroke-linecap="round" />
      `;

    case 'katana':
      return `
        <!-- Katana: Изогнутый самурайский меч с цубой и рукоятью цука -->
        <!-- Рукоять с оплёткой -->
        <rect x="6" y="28" width="28" height="6.5" rx="1.5" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <line x1="12" y1="28" x2="14" y2="34.5" stroke="#fcd34d" stroke-width="1.2" />
        <line x1="18" y1="28" x2="20" y2="34.5" stroke="#fcd34d" stroke-width="1.2" />
        <line x1="24" y1="28" x2="26" y2="34.5" stroke="#fcd34d" stroke-width="1.2" />
        <!-- Цуба (круглая золотая гарда) -->
        <ellipse cx="35" cy="31" rx="2.5" ry="7" fill="#f59e0b" stroke="#09090b" stroke-width="1.2" />
        <!-- Длинный грациозный клинок катаны -->
        <path d="M 37.5 29.5 Q 68 25 93 28.5 L 94 30 Q 68 28 37.5 32.5 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.4" />
        <path d="M 38 29.8 Q 68 25.5 90 28.5" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1" />
      `;

    case 'scythe':
      return `
        <!-- Scythe: Зловещая боевая коса смерти -->
        <!-- Древко -->
        <line x1="15" y1="46" x2="52" y2="18" stroke="${hc}" stroke-width="4.5" stroke-linecap="round" />
        <!-- Костяной шип крепления -->
        <polygon points="50,16 54,16 53,24 49,24" fill="#cbd5e1" stroke="#09090b" stroke-width="1" />
        <!-- Изогнутое дугообразное лезвие косы -->
        <path d="M 52 17 Q 84 10 92 36 Q 74 24 48 22 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
        <path d="M 53 18 Q 80 12 88 34" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.2" />
      `;

    default:
      // Универсальный тактический кинжал (fallback)
      return `
        <rect x="14" y="27" width="28" height="8" rx="2" fill="${hc}" stroke="#0f172a" stroke-width="1.5" />
        <rect x="42" y="22" width="3.5" height="18" rx="1" fill="#64748b" stroke="#09090b" stroke-width="1.2" />
        <path d="M 45.5 27 L 76 27 L 88 31 L 76 35 L 45.5 35 Z" fill="${bladeFill}" stroke="#09090b" stroke-width="1.5" />
      `;
  }
}

let svgIdCounter = 0;

/**
 * Генерирует самостоятельный масштабируемый SVG для UI игры.
 * @param {Object} knife - объект ножа
 * @param {number} size - ширина/высота в пикселях
 * @param {string} extraClass - доп. CSS-классы
 * @returns {string} SVG HTML-строка
 */
export function getKnifeVectorSvg(knife, size = 48, extraClass = '') {
  if (!knife) return `<span class="text-2xl">🗡️</span>`;

  svgIdCounter++;
  const gradId = `knifeGrad_${knife.style}_${svgIdCounter}`;
  const defs = getKnifeSkinDefs(gradId, knife.bladeColor);
  const bladeFill = getSvgBladeFill(knife.bladeColor, gradId);
  const paths = getKnifeVectorSvgPaths(knife.style, bladeFill, knife.handleColor);

  return `
    <svg class="knife-svg select-none pointer-events-none ${extraClass}" width="${size}" height="${size}" viewBox="0 0 100 60" style="overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
      ${defs ? `<defs>${defs}</defs>` : ''}
      ${paths}
    </svg>
  `.trim();
}

/**
 * Отрисовка ножа в лапке какашки на HTML5 Canvas (petCanvasView).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} knife 
 * @param {number} time 
 */
export function drawKnifeVectorOnCanvas(ctx, knife, time) {
  if (!knife) return;

  ctx.save();
  ctx.translate(6, 0);

  // Вычисляем заливку лезвия для Canvas
  let bladeFill = knife.bladeColor || '#94a3b8';
  const color = (knife.bladeColor || '').toLowerCase().trim();

  if (color === 'fade') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#facc15');
    g.addColorStop(0.35, '#f43f5e');
    g.addColorStop(0.7, '#8b5cf6');
    g.addColorStop(1, '#06b6d4');
    bladeFill = g;
  } else if (color === 'rainbow') {
    // 🌈 Настоящий спектральный градиент радуги
    const g = ctx.createLinearGradient(0, -6, 52, 10);
    g.addColorStop(0, '#ef4444');
    g.addColorStop(0.2, '#f97316');
    g.addColorStop(0.4, '#eab308');
    g.addColorStop(0.6, '#22c55e');
    g.addColorStop(0.8, '#06b6d4');
    g.addColorStop(1, '#a855f7');
    bladeFill = g;
  } else if (color === 'celestial') {
    // ✨ Небесный космический градиент звездного света
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#a5f3fc');
    g.addColorStop(0.4, '#06b6d4');
    g.addColorStop(0.75, '#3b82f6');
    g.addColorStop(1, '#1e1b4b');
    bladeFill = g;
  } else if (color === 'titanium') {
    // 💎 Титановый кристальный градиент
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#e0f2fe');
    g.addColorStop(0.5, '#38bdf8');
    g.addColorStop(1, '#1e3a8a');
    bladeFill = g;
  } else if (color === 'marble' || color === 'fire_ice') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#ef4444');
    g.addColorStop(0.5, '#3b82f6');
    g.addColorStop(1, color === 'fire_ice' ? '#06b6d4' : '#eab308');
    bladeFill = g;
  } else if (color === 'lore') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#fef08a');
    g.addColorStop(0.4, '#eab308');
    g.addColorStop(1, '#ca8a04');
    bladeFill = g;
  } else if (color === 'ruby' || color === 'doppler_pink') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#fda4af');
    g.addColorStop(0.5, '#e11d48');
    g.addColorStop(1, '#881337');
    bladeFill = g;
  } else if (color === 'sapphire' || color === 'doppler_blue') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#7dd3fc');
    g.addColorStop(0.5, '#0284c7');
    g.addColorStop(1, '#082f49');
    bladeFill = g;
  } else if (color === 'emerald') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#86efac');
    g.addColorStop(0.5, '#16a34a');
    g.addColorStop(1, '#052e16');
    bladeFill = g;
  } else if (color === 'bluegem') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#38bdf8');
    g.addColorStop(0.6, '#0369a1');
    g.addColorStop(1, '#d97706');
    bladeFill = g;
  } else if (color === 'tiger') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#fef08a');
    g.addColorStop(0.4, '#f59e0b');
    g.addColorStop(1, '#78350f');
    bladeFill = g;
  } else if (color === 'slaughter' || color === 'crimson') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#f87171');
    g.addColorStop(0.5, '#dc2626');
    g.addColorStop(1, '#7f1d1d');
    bladeFill = g;
  } else if (color === 'autotronic') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#ef4444');
    g.addColorStop(0.65, '#b91c1c');
    g.addColorStop(1, '#e2e8f0');
    bladeFill = g;
  } else if (color === 'damascus') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#f8fafc');
    g.addColorStop(0.25, '#94a3b8');
    g.addColorStop(0.5, '#f1f5f9');
    g.addColorStop(0.75, '#64748b');
    g.addColorStop(1, '#cbd5e1');
    bladeFill = g;
  } else if (color === 'hyper') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#22d3ee');
    g.addColorStop(0.35, '#ec4899');
    g.addColorStop(0.7, '#a855f7');
    g.addColorStop(1, '#10b981');
    bladeFill = g;
  } else if (color === 'printstream') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#e2e8f0');
    g.addColorStop(0.85, '#0f172a');
    g.addColorStop(1, '#38bdf8');
    bladeFill = g;
  } else if (color === 'godly') {
    const g = ctx.createLinearGradient(0, -6, 50, 10);
    g.addColorStop(0, '#fef08a');
    g.addColorStop(0.35, '#fbbf24');
    g.addColorStop(0.7, '#b45309');
    g.addColorStop(1, '#312e81');
    bladeFill = g;
  }

  // Ауры редкости
  if (['godly', 'celestial', 'titanium', 'rainbow', 'covert', 'special'].includes(knife.rarity)) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = knife.rarity === 'godly' ? '#facc15'
      : knife.rarity === 'celestial' ? '#22d3ee'
      : knife.rarity === 'covert' ? '#ef4444'
      : '#c084fc';
  }

  const hc = knife.handleColor || '#27272a';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.5;

  // Отрисовка индивидуальной геометрии для каждого из 19 стилей ножей
  switch (knife.style) {
    case 'karambit': {
      // Karambit: Изогнутый коготь тигра с кольцом под палец
      ctx.beginPath(); ctx.arc(-7, 8, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = hc; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-7, 8, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; ctx.fill();
      // Рукоять с выемками под пальцы
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(-2, 5); ctx.lineTo(13, 0); ctx.lineTo(10, 10); ctx.lineTo(-4, 11);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Серповидный клинок
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.quadraticCurveTo(38, -6, 48, 16);
      ctx.quadraticCurveTo(28, 8, 10, 10);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Ребро жесткости
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(14, 1); ctx.quadraticCurveTo(34, -4, 46, 14); ctx.stroke();
      break;
    }

    case 'talon': {
      // Talon: Серповидный нож с зубьями на обухе
      ctx.beginPath(); ctx.arc(-7, 8, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = hc; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-7, 8, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; ctx.fill();
      // Рукоять
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(-2, 5); ctx.lineTo(13, 0); ctx.lineTo(10, 10); ctx.lineTo(-4, 11);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Зубья на обухе
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(17, -1); ctx.lineTo(19, -4); ctx.lineTo(21, -1);
      ctx.moveTo(23, -2); ctx.lineTo(25, -5); ctx.lineTo(27, -2);
      ctx.moveTo(29, -3); ctx.lineTo(31, -6); ctx.lineTo(33, -3);
      ctx.fill();
      // Клинок
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.quadraticCurveTo(38, -8, 50, 15);
      ctx.quadraticCurveTo(28, 8, 10, 10);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }

    case 'butterfly': {
      // Butterfly (Балисонг): Раздельные рукоятки с зазором и шарнирами
      ctx.fillStyle = hc;
      ctx.fillRect(-8, -8, 20, 5.5);
      ctx.fillRect(-8, 5, 20, 5.5);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.arc(11, -5.5, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(11, 7.5, 1.8, 0, Math.PI * 2); ctx.fill();
      // Обоюдоострый штыковой клинок
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(12, -3); ctx.lineTo(46, -1); ctx.lineTo(52, 0); ctx.lineTo(46, 1); ctx.lineTo(12, 3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(48, 0); ctx.stroke();
      break;
    }

    case 'bowie': {
      // Bowie: Большой массивный тесак с гардой и скосом обуха Clip-Point
      ctx.fillStyle = hc; ctx.fillRect(-8, -4, 18, 9);
      // Массивная золотая/латунная гарда
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(10, -11, 4, 23);
      ctx.strokeRect(10, -11, 4, 23);
      // Широкий клинок со скосом
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(14, -5); ctx.lineTo(36, -5);
      ctx.quadraticCurveTo(46, -4, 54, 1);
      ctx.quadraticCurveTo(42, 10, 14, 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Скос Clip-point
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(36, -5); ctx.quadraticCurveTo(46, -4, 54, 1); ctx.stroke();
      break;
    }

    case 'huntsman': {
      // Huntsman: Шоковые зубья на обухе и рубленое танто-остриё
      ctx.fillStyle = hc; ctx.fillRect(-7, -4, 17, 9);
      // Зубья на обухе
      ctx.fillStyle = bladeFill;
      for (let s = 14; s < 30; s += 4) {
        ctx.beginPath(); ctx.moveTo(s, -5); ctx.lineTo(s + 2, -8); ctx.lineTo(s + 4, -5); ctx.fill(); ctx.stroke();
      }
      // Клинок Танто
      ctx.beginPath();
      ctx.moveTo(10, -5); ctx.lineTo(38, -5); ctx.lineTo(52, 2); ctx.lineTo(42, 6); ctx.lineTo(10, 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Грань Танто
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(38, -5); ctx.lineTo(42, 6); ctx.stroke();
      break;
    }

    case 'gut': {
      // Gut Knife: Массивный клинок с детальным шкуродёрным крюком
      ctx.fillStyle = hc; ctx.fillRect(-6, -4, 18, 9);
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath(); ctx.arc(-1, 0, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 0, 1.3, 0, Math.PI * 2); ctx.fill();
      // Клинок с брюшком и крюком
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(12, -5); ctx.lineTo(38, -5);
      ctx.quadraticCurveTo(46, -5, 50, -10);
      ctx.quadraticCurveTo(53, -8, 48, -2);
      ctx.lineTo(44, 1);
      ctx.quadraticCurveTo(38, 10, 12, 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Заточка крюка
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(42, -7); ctx.quadraticCurveTo(48, -8, 47, -3); ctx.stroke();
      break;
    }

    case 'falchion': {
      // Falchion: Расширяющийся восточный клинок
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(-8, 3); ctx.lineTo(12, 0); ctx.lineTo(10, 8); ctx.lineTo(-6, 9);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Расширяющееся лезвие
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.quadraticCurveTo(32, -3, 42, -8);
      ctx.lineTo(52, -4);
      ctx.quadraticCurveTo(40, 8, 10, 8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }

    case 'flip': {
      // Flip: Складной изогнутый нож с плавником-флиппером
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(-8, 2); ctx.lineTo(12, -1); ctx.lineTo(10, 8); ctx.lineTo(-6, 8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Осевой винт
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(11, 2, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Флиппер
      ctx.fillStyle = bladeFill;
      ctx.beginPath(); ctx.moveTo(12, 6); ctx.lineTo(16, 8); ctx.lineTo(14, 4); ctx.fill();
      // Изогнутый клинок
      ctx.beginPath();
      ctx.moveTo(12, -1);
      ctx.quadraticCurveTo(32, -6, 50, -2);
      ctx.quadraticCurveTo(36, 6, 10, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }

    case 'stiletto': {
      // Stiletto: Тонкий итальянский стилет-игла с крестовиной
      ctx.fillStyle = hc; ctx.fillRect(-8, -2.5, 18, 5);
      // Крестовина (гарда)
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(10, -8, 3.5, 16); ctx.strokeRect(10, -8, 3.5, 16);
      // Игольчатый тонкий клинок
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(13.5, -2); ctx.lineTo(54, 0); ctx.lineTo(13.5, 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Центральное ребро
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(52, 0); ctx.stroke();
      break;
    }

    case 'navaja': {
      // Navaja: Традиционная испанская наваха с изогнутой рукоятью
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(-8, 5); ctx.lineTo(12, 1); ctx.lineTo(10, 9); ctx.lineTo(-6, 9);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Листовидный клинок
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(12, 1);
      ctx.quadraticCurveTo(30, -5, 48, -3);
      ctx.quadraticCurveTo(34, 7, 10, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }

    case 'ursus': {
      // Ursus: Прямой массивный тактический нож танто
      ctx.fillStyle = hc; ctx.fillRect(-7, -4, 18, 8);
      // Клинок Танто
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(11, -4); ctx.lineTo(38, -4); ctx.lineTo(50, 1); ctx.lineTo(38, 4); ctx.lineTo(11, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(38, -4); ctx.lineTo(38, 4); ctx.stroke();
      break;
    }

    case 'paracord': {
      // Paracord: Рукоять с цветными витками тактического шнура
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-7, -4, 18, 8); ctx.strokeRect(-7, -4, 18, 8);
      ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 2;
      for (let s = -4; s < 9; s += 3.5) {
        ctx.beginPath(); ctx.moveTo(s, -4); ctx.lineTo(s + 2, 4); ctx.stroke();
      }
      // Клинок Drop-Point с отверстием
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(11, -4); ctx.lineTo(40, -4);
      ctx.quadraticCurveTo(50, -2, 52, 1);
      ctx.quadraticCurveTo(42, 5, 11, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(19, 0, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'survival': {
      // Survival: Нож выживания с пилой и стропорезом
      ctx.fillStyle = hc; ctx.fillRect(-7, -4, 18, 8);
      // Пила на обухе
      ctx.fillStyle = bladeFill;
      for (let s = 13; s < 25; s += 3.5) {
        ctx.beginPath(); ctx.moveTo(s, -4); ctx.lineTo(s + 1.8, -7); ctx.lineTo(s + 3.5, -4); ctx.fill(); ctx.stroke();
      }
      // Клинок со стропорезом
      ctx.beginPath();
      ctx.moveTo(11, -4); ctx.lineTo(32, -4);
      ctx.quadraticCurveTo(36, -8, 39, -4);
      ctx.lineTo(49, 1);
      ctx.quadraticCurveTo(40, 5, 11, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }

    case 'nomad': {
      // Nomad: Полевой складной нож с отверстием в клинке
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(-8, 3); ctx.lineTo(12, -1); ctx.lineTo(10, 7); ctx.lineTo(-6, 7);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Клинок
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(12, -1);
      ctx.quadraticCurveTo(32, -6, 50, -1);
      ctx.quadraticCurveTo(38, 6, 10, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Продольное отверстие
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.roundRect(22, -2, 11, 2.2, 1); ctx.fill();
      break;
    }

    case 'classic': {
      // Classic: Легендарный нож CS 1.6 с гардой
      ctx.fillStyle = hc; ctx.fillRect(-7, -4, 17, 8);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(10, -7, 3, 14); ctx.strokeRect(10, -7, 3, 14);
      // Клинок CS 1.6
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(13, -4); ctx.lineTo(38, -4); ctx.lineTo(49, 0);
      ctx.quadraticCurveTo(38, 5, 13, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Кровосток
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(36, 0); ctx.stroke();
      break;
    }

    case 'm9': {
      // M9 Bayonet: Гарда с кольцом, пила на обухе и широкий клинок
      ctx.fillStyle = hc; ctx.fillRect(-8, -4, 16, 8);
      // Гарда с кольцом
      ctx.fillStyle = '#64748b'; ctx.fillRect(8, -10, 4.5, 20); ctx.strokeRect(8, -10, 4.5, 20);
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(10.2, -7.5, 2, 0, Math.PI * 2); ctx.fill();
      // Пила на обухе
      ctx.fillStyle = bladeFill;
      for (let s = 14; s < 34; s += 3.5) {
        ctx.beginPath(); ctx.moveTo(s, -5); ctx.lineTo(s + 1.8, -8); ctx.lineTo(s + 3.5, -5); ctx.fill(); ctx.stroke();
      }
      // Клинок M9 с долом
      ctx.beginPath();
      ctx.moveTo(12.5, -5); ctx.lineTo(44, -5); ctx.lineTo(53, 1); ctx.lineTo(42, 5); ctx.lineTo(12.5, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(38, 0); ctx.stroke();
      break;
    }

    case 'bayonet': {
      // Bayonet: Прямой армейский штык-нож с гардой
      ctx.fillStyle = hc; ctx.fillRect(-8, -4, 16, 8);
      ctx.fillStyle = '#52525b'; ctx.fillRect(8, -9, 4, 18); ctx.strokeRect(8, -9, 4, 18);
      // Клинок
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(12, -4.5); ctx.lineTo(44, -4.5); ctx.lineTo(52, 0); ctx.lineTo(42, 4.5); ctx.lineTo(12, 4.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(38, 0); ctx.stroke();
      break;
    }

    case 'katana': {
      // Katana: Самурайский меч с длинным клинком и цубой
      ctx.fillStyle = hc; ctx.fillRect(-14, -3.5, 20, 7);
      // Золотая цуба (гарда)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(7, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Грациозный длинный клинок
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(7, -3);
      ctx.quadraticCurveTo(38, -8, 64, -3);
      ctx.lineTo(66, -1);
      ctx.quadraticCurveTo(38, 2, 7, 3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(8, -2.5); ctx.quadraticCurveTo(38, -7.5, 62, -2.5); ctx.stroke();
      break;
    }

    case 'scythe': {
      // Scythe: Боевая коса смерти
      ctx.strokeStyle = hc; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-10, 16); ctx.lineTo(14, -10); ctx.stroke();
      // Дугообразное лезвие косы
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(14, -10);
      ctx.quadraticCurveTo(46, -18, 52, 8);
      ctx.quadraticCurveTo(34, -2, 10, -5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(15, -9); ctx.quadraticCurveTo(44, -16, 49, 6); ctx.stroke();
      break;
    }

    default: {
      // Универсальный кинжал (daggers, skeleton или fallback)
      ctx.fillStyle = hc; ctx.fillRect(-6, -4, 16, 8);
      ctx.fillStyle = '#64748b'; ctx.fillRect(10, -7, 3, 14); ctx.strokeRect(10, -7, 3, 14);
      ctx.fillStyle = bladeFill;
      ctx.beginPath();
      ctx.moveTo(13, -4); ctx.lineTo(44, -4); ctx.lineTo(52, 0); ctx.lineTo(44, 4); ctx.lineTo(13, 4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
  }

  // Блик заточки
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath(); ctx.arc(38, -1, 1.8, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

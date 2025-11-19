const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value = '') {
  if (!value) return false;
  return EMAIL_REGEX.test(value.trim().toLowerCase());
}

export function isValidGenreList(value = '') {
  if (!value.trim()) return true;
  const segments = value.split(',').map((genre) => genre.trim());
  const filtered = segments.filter(Boolean);
  return segments.length === filtered.length;
}

export function getGenresFromInput(value = '') {
  if (!value.trim()) return [];
  return value
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean);
}

const PASSWORD_LEVELS = [
  { score: 0, label: 'Too short', color: '#b91c1c' },
  { score: 1, label: 'Weak', color: '#f97316' },
  { score: 2, label: 'Fair', color: '#eab308' },
  { score: 3, label: 'Good', color: '#22c55e' },
  { score: 4, label: 'Strong', color: '#16a34a' },
];

export function getPasswordStrength(password = '') {
  if (!password) {
    return { score: 0, label: 'Too short', color: '#b91c1c' };
  }

  let score = 0;
  const checks = [
    /.{8,}/,
    /[a-z]/,
    /[A-Z]/,
    /\d/,
    /[^A-Za-z0-9]/,
  ];

  checks.forEach((regex) => {
    if (regex.test(password)) {
      score += 1;
    }
  });

  if (password.length < 6) {
    score = 0;
  } else if (score >= PASSWORD_LEVELS.length) {
    score = PASSWORD_LEVELS.length - 1;
  }

  const level = PASSWORD_LEVELS[Math.min(score, PASSWORD_LEVELS.length - 1)];
  return level;
}

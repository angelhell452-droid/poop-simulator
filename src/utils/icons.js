/**
 * Universal SVG Plunger & Golden Roll Icons
 * Guarantees crisp, high-res rendering across all OS versions (avoiding Windows tofu □ boxes).
 */

export const PLUNGER_SVG = `<svg class="plunger-icon inline-block align-middle select-none shrink-0" viewBox="0 0 24 24" width="1.15em" height="1.15em" style="vertical-align:-0.18em" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 2.5C11 1.67 11.67 1 12.5 1C13.33 1 14 1.67 14 2.5V13H11V2.5Z" fill="#D97706"/><path d="M11.8 2C11.8 1.7 12.1 1.5 12.5 1.5C12.9 1.5 13.2 1.7 13.2 2V13H11.8V2Z" fill="#FBBF24"/><path d="M7 19.5C7 15.5 9.5 13.5 11 13H14C15.5 13.5 18 15.5 18 19.5H7Z" fill="#DC2626"/><path d="M9 18C9 15.8 10.5 14.5 12 14.2" stroke="#FCA5A5" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="12.5" cy="19.8" rx="6" ry="1.7" fill="#991B1B"/><ellipse cx="12.5" cy="19.5" rx="5.2" ry="1.2" fill="#EF4444"/></svg>`;

export function getPlungerIcon(className = 'plunger-icon') {
  return `<span class="${className}"></span>`;
}

export const ROLL_SVG = `<svg class="roll-icon inline-block align-middle select-none shrink-0" viewBox="0 0 24 24" width="1.15em" height="1.15em" style="vertical-align:-0.18em" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6.5C6 4.5 9 3 13 3C17 3 20 4.5 20 6.5V15.5C20 17.5 17 19 13 19C9 19 6 17.5 6 15.5V6.5Z" fill="#D97706"/><path d="M6 6.5C6 4.5 9 3 13 3C17 3 20 4.5 20 6.5V15C19 16.5 16 17.8 13 17.8C9.5 17.8 7 16.5 6 15V6.5Z" fill="#FBBF24"/><path d="M6 10V20C6 20.8 7 21.5 8.5 21.5H12C10 21 8 20 8 18.5V10H6Z" fill="#F59E0B"/><path d="M7 11V19.5C7.5 20 9 20.5 11 20.8V19C10 18.5 9 17.5 9 16.5V11H7Z" fill="#FEF08A"/><ellipse cx="13" cy="6.5" rx="7" ry="3.5" fill="#FEF08A"/><ellipse cx="13" cy="6.5" rx="3" ry="1.6" fill="#78350F"/><ellipse cx="13" cy="6.8" rx="2.3" ry="1.2" fill="#451A03"/><path d="M8 7.5C10 8.5 14 8.5 17 7.5" stroke="#FDE047" stroke-width="0.8" fill="none"/></svg>`;

export function getRollIcon(className = 'roll-icon') {
  return `<span class="${className}"></span>`;
}


/**
 * Universal SVG Plunger Icon
 * Guarantees crisp, high-res plunger rendering across all OS versions (avoiding Windows tofu □ boxes).
 */

export const PLUNGER_SVG = `<svg class="plunger-icon inline-block align-middle select-none shrink-0" viewBox="0 0 24 24" width="1.15em" height="1.15em" style="vertical-align:-0.18em" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 2.5C11 1.67 11.67 1 12.5 1C13.33 1 14 1.67 14 2.5V13H11V2.5Z" fill="#D97706"/><path d="M11.8 2C11.8 1.7 12.1 1.5 12.5 1.5C12.9 1.5 13.2 1.7 13.2 2V13H11.8V2Z" fill="#FBBF24"/><path d="M7 19.5C7 15.5 9.5 13.5 11 13H14C15.5 13.5 18 15.5 18 19.5H7Z" fill="#DC2626"/><path d="M9 18C9 15.8 10.5 14.5 12 14.2" stroke="#FCA5A5" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="12.5" cy="19.8" rx="6" ry="1.7" fill="#991B1B"/><ellipse cx="12.5" cy="19.5" rx="5.2" ry="1.2" fill="#EF4444"/></svg>`;

export function getPlungerIcon(className = 'plunger-icon') {
  return `<span class="${className}"></span>`;
}

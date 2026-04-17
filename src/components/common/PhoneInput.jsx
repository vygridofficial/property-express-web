import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { COUNTRY_CODES, DEFAULT_COUNTRY, findByDial } from '../../data/countryCodes';
import styles from './PhoneInput.module.css';

/**
 * PhoneInput — Reusable country-code + phone number field.
 *
 * The dropdown renders via a React Portal at document.body and is positioned
 * using getBoundingClientRect, so it always anchors directly below the trigger
 * button regardless of parent overflow, modals, or drawers.
 *
 * Props:
 *   value        {string}   — raw phone number (digits only)
 *   countryCode  {string}   — dial code string e.g. "+91"
 *   onChange     {function(phone: string, countryCode: string)} — fired on change
 *   placeholder  {string}   — optional placeholder for number field
 *   error        {string}   — optional inline error text
 *   disabled     {boolean}
 *   theme        {"light"|"dark"}  — "light" for seller/public, "dark" for admin
 *   wrapperStyle {object}   — extra styles on outer wrapper
 *   id           {string}   — id for the number input (for label association)
 */
export default function PhoneInput({
  value = '',
  countryCode = '+91',
  onChange,
  placeholder = 'Enter phone number',
  error,
  disabled = false,
  theme = 'light',
  wrapperStyle = {},
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 280 });

  const btnRef    = useRef(null);   // the trigger button
  const searchRef = useRef(null);   // search input inside portal

  // Resolve selected country
  const selected = findByDial(countryCode) || DEFAULT_COUNTRY;

  // Filtered country list
  const filtered = search.trim()
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search)
      )
    : COUNTRY_CODES;

  // ── Calculate portal position from the trigger button ──────────────
  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const DROPDOWN_HEIGHT = 280;

    // Flip upward if not enough space below
    const top = spaceBelow >= DROPDOWN_HEIGHT
      ? rect.bottom + window.scrollY + 4
      : rect.top  + window.scrollY - DROPDOWN_HEIGHT - 4;

    setDropdownPos({
      top,
      left: rect.left + window.scrollX,
      width: Math.max(280, rect.width),
    });
  };

  // ── Open / close ───────────────────────────────────────────────────
  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) updatePosition();
    setIsOpen((prev) => !prev);
    setSearch('');
  };

  // ── Close on outside click (portal-aware) ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      // Close if click is outside both the trigger button and the portal dropdown
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        !e.target.closest('[data-phone-dropdown]')
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Reposition on scroll / resize while open ───────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);   // capture phase catches all scroll containers
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen]);

  // ── Auto-focus search on open ──────────────────────────────────────
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // ── Selection ─────────────────────────────────────────────────────
  const handleSelectCountry = (country) => {
    setIsOpen(false);
    setSearch('');
    onChange?.(value, country.dial);
  };

  // ── Number field handlers ─────────────────────────────────────────
  const handleNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange?.(digits, countryCode);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    const dialDigits = countryCode.replace(/\D/g, '');
    const stripped =
      pasted.startsWith(dialDigits) && pasted.length > dialDigits.length
        ? pasted.slice(dialDigits.length)
        : pasted;
    onChange?.(stripped, countryCode);
  };

  // Component now relies on global styling for theme selection

  // ── Portal dropdown markup ────────────────────────────────────────
  const dropdownEl = isOpen
    ? createPortal(
        <div
          data-phone-dropdown="true"
          className={styles.dropdown}
          style={{
            position: 'fixed',
            top:  dropdownPos.top - window.scrollY,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 99999,
          }}
          role="listbox"
        >
          {/* Search bar */}
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search country or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className={styles.searchClear}
                onMouseDown={(e) => { e.preventDefault(); setSearch(''); }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Country list */}
          <ul className={styles.list}>
            {filtered.length === 0 && (
              <li className={styles.noResult}>No countries found</li>
            )}
            {filtered.map((country) => (
              <li
                key={country.code}
                role="option"
                aria-selected={country.dial === countryCode}
                className={`${styles.listItem} ${
                  country.dial === countryCode ? styles.listItemActive : ''
                }`}
                onMouseDown={(e) => { e.preventDefault(); handleSelectCountry(country); }}
              >
                <span className={styles.itemFlag}>{country.flag}</span>
                <span className={styles.itemName}>{country.name}</span>
                <span className={styles.itemDial}>{country.dial}</span>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={styles.wrapper} style={wrapperStyle}>
      <div
        className={`${styles.inputRow} ${error ? styles.inputRowError : ''} ${
          disabled ? styles.inputRowDisabled : ''
        }`}
      >
        {/* ── Country selector trigger ── */}
        <button
          ref={btnRef}
          type="button"
          className={styles.selectorBtn}
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.flag}>{selected.flag}</span>
          <span className={styles.dialCode}>{selected.dial}</span>
          <ChevronDown
            size={13}
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          />
        </button>

        {/* ── Divider ── */}
        <div className={styles.divider} />

        {/* ── Number input ── */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          className={styles.numberInput}
          value={value}
          onChange={handleNumberChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="tel-national"
        />
      </div>

      {/* ── Inline error ── */}
      {error && <span className={styles.errorMsg}>{error}</span>}

      {/* ── Portal-rendered dropdown ── */}
      {dropdownEl}
    </div>
  );
}

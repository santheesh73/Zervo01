import React, { useState, useEffect, useRef } from 'react';

/**
 * ProfileDropdown Component
 * 
 * A reusable, accessible dropdown for user profiles.
 * Features:
 * - Click outside to close
 * - Escape key to close
 * - Keyboard navigation (Tab/Shift+Tab)
 * - CSS transition based animations (fade + slide)
 * - Supports showing avatar or fallback icon, name, and email
 */
const ProfileDropdown = ({ 
  user = {
    name: 'Sarah Miller',
    email: 'sarah@greenvalley.org',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcePFs6Gd6MkAjvPopZNI1Mu_OSSdyZFpyvAWW7BUi7t3NirADmQGsth7JorkTMM5PuRcv2iRAl1BlN6iFqS47pebGbp-Stt-snlXyGFHpOcuzmltRj7SwYuc8bIwgXOaQRzm74LHwkXjxUU1MKA7DDnEb30I0xYOO9mATGgeyq27iNwOHr_jIlEP6X10s1J2BjYFbuhpgmWn7YI0iiuyvR6uh8V7JQ5DpwpylHUAeAjxSIyQZRdieCW7P_gbAue9IyE6HRa8DuKU'
  },
  onLogout,
  onSettingsClick,
  onProfileClick 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        // Return focus to trigger when closing via keyboard
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Helper to extract initials if no avatar is provided
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative inline-block text-left font-body">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center justify-center rounded-full ring-2 ring-transparent focus:outline-none focus:ring-primary/50 hover:ring-primary/20 transition-all duration-200 active:scale-95 overflow-hidden"
      >
        {user.avatarUrl ? (
          <div className="w-10 h-10 border-2 border-primary/20 rounded-full overflow-hidden">
             <img 
               src={user.avatarUrl} 
               alt={`${user.name}'s avatar`} 
               className="w-full h-full object-cover"
             />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold tracking-wider">
            {getInitials(user.name)}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      <div
        ref={dropdownRef}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="user-menu"
        className={`
          absolute right-0 mt-3 w-64 bg-surface-container-lowest dark:bg-zinc-900 rounded-2xl shadow-xl border border-outline-variant/20 z-50 overflow-hidden transform origin-top-right transition-all duration-200 ease-out flex flex-col
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointers-events-none'}
        `}
      >
        {/* User Info Header */}
        <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/50">
          <p className="font-headline font-bold text-on-surface text-sm truncate" role="none">
            {user.name}
          </p>
          {user.email && (
            <p className="text-on-surface-variant font-medium text-xs mt-0.5 truncate" role="none">
              {user.email}
            </p>
          )}
        </div>

        {/* Menu Items */}
        <div className="py-2" role="none">
          <button
            onClick={() => { setIsOpen(false); onProfileClick?.(); }}
            className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-variant/40 hover:text-primary transition-colors focus:bg-surface-variant/40 focus:outline-none"
            role="menuitem"
          >
            <span className="material-symbols-outlined mr-3 text-[20px]">person</span>
            View Profile
          </button>
          
          <button
            onClick={() => { setIsOpen(false); onSettingsClick?.(); }}
            className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-variant/40 hover:text-primary transition-colors focus:bg-surface-variant/40 focus:outline-none"
            role="menuitem"
          >
            <span className="material-symbols-outlined mr-3 text-[20px]">settings</span>
            Settings
          </button>
        </div>

        {/* Logout Section */}
        <div className="py-2 border-t border-outline-variant/10" role="none">
          <button
            onClick={() => { setIsOpen(false); onLogout?.(); }}
            className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-error hover:bg-error/10 transition-colors focus:bg-error/10 focus:outline-none"
            role="menuitem"
          >
            <span className="material-symbols-outlined mr-3 text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDropdown;

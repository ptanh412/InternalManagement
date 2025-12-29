import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
const CustomSelect = ({ 
//   label, 
  name, 
  value, 
  options, 
  onChange, 
  error, 
  required,
  icon: Icon,
  placeholder = 'Select an option',
  showSkills = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options.find(opt => opt.value === '');
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label> */}
      
      {/* Button/Input that triggers the dropdown */}
      <button
        type="button"
        className={`w-full flex text-left items-center justify-between pl-4 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
          error ? 'border-red-300 bg-red-50 dark:bg-red-900/30' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
        } ${isOpen ? 'ring-2 ring-primary-500 border-primary-500 dark:border-primary-500' : 'dark:ring-0'} `}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
            {Icon && <Icon className="h-5 w-5 text-gray-400 mr-3" />}
            <span className={`block truncate ${!selectedOption ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {displayLabel}
            </span>
        </div>
        <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            aria-hidden="true" 
        />
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown Options List */}
      {isOpen && (
        <ul
          className="absolute dark:text-white z-20 mt-1 min-w-full w-auto bg-white dark:bg-gray-800 shadow-xl max-h-80 rounded-lg py-1 ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
          tabIndex="-1"
          role="listbox"
          aria-labelledby={name}
        >
          {options.map((option) => (
            <li
              key={option.value}
              className={`text-gray-900 cursor-pointer select-none relative py-2 pl-10 pr-4 transition-colors ${
                option.value === value ? 'bg-primary-100 text-primary-800 font-semibold dark:bg-primary-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${showSkills && option.skills ? 'pb-3' : ''}`}
              id={`option-${option.value}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option.value)}
            >
              <div className="flex flex-col">
                <span className={`block dark:text-white ${option.value === value ? 'font-semibold' : 'font-normal'}`}>
                  {option.label}
                </span>
                
                {/* Display skills if showSkills is true and option has skills */}
                {showSkills && option.skills && option.skills.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {option.skills.slice(0, 5).map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                      >
                        {skill.skillName}
                      </span>
                    ))}
                    {option.skills.length > 5 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        +{option.skills.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {option.value === value && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
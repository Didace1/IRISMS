// src/features/fault-diagnosis/components/DeviceInfoForm.jsx
import React, { useState } from 'react';

const BRANDS = {
  Laptop:     ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer'],
  Smartphone: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'],
};

const MODELS = {
  Laptop: {
    HP: [
      'Pavilion 14', 'Pavilion 15', 'Pavilion 16',
      'Pavilion x360 14', 'Pavilion x360 15',
      'Envy 13', 'Envy 15', 'Envy 16',
      'Envy x360 13', 'Envy x360 14', 'Envy x360 15',
      'Spectre x360 13', 'Spectre x360 14', 'Spectre x360 16',
      'EliteBook 840', 'EliteBook 850', 'EliteBook 860',
      'EliteBook 1040', 'EliteBook 1050',
      'ProBook 440', 'ProBook 450', 'ProBook 455', 'ProBook 470',
      'Omen 15', 'Omen 16', 'Omen 17',
      'Stream 11', 'Stream 14',
      'ZBook Firefly 14', 'ZBook Firefly 16', 'ZBook Studio 16', 'ZBook Fury 16',
      'HP Chromebook 14',
    ],
    Dell: [
      'Inspiron 14', 'Inspiron 15 3000', 'Inspiron 15 5000', 'Inspiron 16 5000',
      'Inspiron 14 2-in-1', 'Inspiron 16 Plus',
      'XPS 13', 'XPS 13 Plus', 'XPS 15', 'XPS 17',
      'Latitude 5420', 'Latitude 5430', 'Latitude 5530', 'Latitude 5540',
      'Latitude 7420', 'Latitude 7430', 'Latitude 7530', 'Latitude 7540',
      'Latitude 9420', 'Latitude 9440',
      'Vostro 14 3000', 'Vostro 14 5000', 'Vostro 15 3000', 'Vostro 15 5000',
      'Alienware m16', 'Alienware m18', 'Alienware x14', 'Alienware x16',
      'Dell G15', 'Dell G16',
      'Precision 3480', 'Precision 3490', 'Precision 5480', 'Precision 5490',
      'Precision 7680', 'Precision 7780',
    ],
    Lenovo: [
      'ThinkPad T14', 'ThinkPad T14s', 'ThinkPad T16',
      'ThinkPad X1 Carbon', 'ThinkPad X1 Extreme', 'ThinkPad X1 Yoga', 'ThinkPad X13',
      'ThinkPad E14', 'ThinkPad E15', 'ThinkPad E16',
      'ThinkPad L14', 'ThinkPad L15', 'ThinkPad L16',
      'ThinkPad P14s', 'ThinkPad P15v', 'ThinkPad P16',
      'IdeaPad 1', 'IdeaPad 3', 'IdeaPad 5', 'IdeaPad 5 Pro', 'IdeaPad Gaming 3',
      'Legion 5 Gen 8', 'Legion 5 Gen 9', 'Legion 5 Pro Gen 8', 'Legion 5 Pro Gen 9',
      'Legion 7 Gen 8', 'Legion 7 Gen 9', 'Legion Slim 5', 'Legion Slim 7',
      'Yoga 7', 'Yoga 9', 'Yoga Slim 7', 'Yoga Book 9i',
      'ThinkBook 14', 'ThinkBook 15', 'ThinkBook 16', 'ThinkBook 16 Gen 6',
      'LOQ 15', 'LOQ 16',
    ],
    Apple: [
      'MacBook Air 13-inch (M1, 2020)',
      'MacBook Air 13-inch (M2, 2022)',
      'MacBook Air 15-inch (M2, 2023)',
      'MacBook Air 13-inch (M3, 2024)',
      'MacBook Air 15-inch (M3, 2024)',
      'MacBook Pro 13-inch (M1, 2020)',
      'MacBook Pro 14-inch (M1 Pro / M1 Max, 2021)',
      'MacBook Pro 16-inch (M1 Pro / M1 Max, 2021)',
      'MacBook Pro 13-inch (M2, 2022)',
      'MacBook Pro 14-inch (M2 Pro / M2 Max, 2023)',
      'MacBook Pro 16-inch (M2 Pro / M2 Max, 2023)',
      'MacBook Pro 14-inch (M3 Pro / M3 Max, 2023)',
      'MacBook Pro 16-inch (M3 Pro / M3 Max, 2023)',
      'MacBook Pro 13-inch (Intel, 2016–2020)',
      'MacBook Pro 15-inch (Intel, 2016–2019)',
      'MacBook Pro 16-inch (Intel, 2019)',
      'MacBook Air 13-inch (Intel, 2018–2020)',
      'MacBook (Retina, 12-inch, 2015–2019)',
      'MacBook Pro (Unibody, 13-inch, 2009–2012)',
      'MacBook Pro (Unibody, 15-inch, 2009–2012)',
    ],
    ASUS: [
      'ROG Zephyrus G14 (GA401/GA403)',
      'ROG Zephyrus G16 (GU605)',
      'ROG Zephyrus S16 (GU603)',
      'ROG Strix G15 (G513)',
      'ROG Strix G16 (G614)',
      'ROG Strix G17 (G713)',
      'ROG Strix G18 (G814)',
      'ROG Strix SCAR 16', 'ROG Strix SCAR 18',
      'ROG Flow X13 (GV301)',
      'ROG Flow X16 (GV601)',
      'ROG Flow Z13 (GZ301)',
      'TUF Gaming A15 (FA506)', 'TUF Gaming A16 (FA607)',
      'TUF Gaming A17 (FA707)', 'TUF Gaming F15 (FX507)', 'TUF Gaming F17 (FX707)',
      'ZenBook 13 (UX325)', 'ZenBook 14 (UX425)', 'ZenBook 14X (UX5401)',
      'ZenBook 14 OLED (UX3405)', 'ZenBook 15 OLED (UM3504)',
      'ZenBook Pro 14 OLED (UX6404)', 'ZenBook Pro 16X OLED (UX7602)',
      'ZenBook Flip 13 OLED (UP5302)', 'ZenBook Flip 14 OLED (UP5401)',
      'ZenBook Duo 14 (UX482)', 'ZenBook Duo 16 (UX8402)',
      'Vivobook 14 (X1402)', 'Vivobook 15 (X1502)', 'Vivobook 16 (X1605)',
      'Vivobook Pro 14 OLED (N7401)', 'Vivobook Pro 15 OLED (K6502)',
      'Vivobook S 14 OLED (M5406)', 'Vivobook S 15 OLED (M5506)',
      'ProArt Studiobook 16 OLED (H7604)', 'ProArt Studiobook Pro 16 OLED (W7604)',
      'ExpertBook B5 (B5602)', 'ExpertBook B7 (B7402)',
    ],
    Acer: [
      'Predator Helios 300 (PH315 / PH317)',
      'Predator Helios 16 (PH16)',
      'Predator Helios 18 (PH18)',
      'Predator Triton 300 SE (PT314)',
      'Predator Triton 500 SE (PT516)',
      'Predator Triton 16 (PT16)',
      'Nitro 5 (AN515 / AN517)',
      'Nitro 16 (AN16)',
      'Nitro V 15 (ANV15)',
      'Aspire 3 (A315)', 'Aspire 5 (A515)', 'Aspire 7 (A715)',
      'Aspire Vero (AV15 / AV16)', 'Aspire Lite (AL14 / AL15)',
      'Swift 3 (SF314)', 'Swift 5 (SF514)',
      'Swift X 14 (SFX14)', 'Swift X 16 (SFX16)',
      'Swift Go 14 (SFG14)', 'Swift Go 16 (SFG16)',
      'Spin 3 (SP314)', 'Spin 5 (SP514)',
      'Spin 14 (SP14)', 'Spin 16 (SP16)',
      'TravelMate P2 (TMP214)', 'TravelMate P4 (TMP414)',
      'TravelMate P6 (TMP614)',
      'ConceptD 3 (CN314)', 'ConceptD 5 (CN514)', 'ConceptD 7 (CN715)',
      'Acer Chromebook 314', 'Acer Chromebook Spin 514',
    ],
  },
  Smartphone: {
    Apple: [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 mini', 'iPhone 13',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 mini', 'iPhone 12',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
      'iPhone SE (3rd generation)', 'iPhone SE (2nd generation)',
      'iPhone 8 Plus', 'iPhone 8',
    ],
    Samsung: [
      'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25',
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S24 FE',
      'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
      'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
      'Galaxy Z Fold 6', 'Galaxy Z Flip 6',
      'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
      'Galaxy Z Fold 4', 'Galaxy Z Flip 4',
      'Galaxy A55 5G', 'Galaxy A54 5G', 'Galaxy A35 5G',
      'Galaxy A34 5G', 'Galaxy A25 5G', 'Galaxy A15 5G', 'Galaxy A15',
      'Galaxy M55', 'Galaxy M35', 'Galaxy M15',
      'Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S9 FE',
    ],
    Google: [
      'Pixel 9 Pro XL', 'Pixel 9 Pro Fold', 'Pixel 9 Pro', 'Pixel 9',
      'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
      'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
      'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a',
      'Pixel 5', 'Pixel 4a 5G', 'Pixel 4a',
    ],
    OnePlus: [
      'OnePlus 12', 'OnePlus 12R',
      'OnePlus Open', 'OnePlus Open Apex',
      'OnePlus 11', 'OnePlus 11R',
      'OnePlus 10 Pro', 'OnePlus 10T', 'OnePlus 10R',
      'OnePlus Nord 4', 'OnePlus Nord CE 4', 'OnePlus Nord CE 4 Lite',
      'OnePlus Nord 3', 'OnePlus Nord CE 3', 'OnePlus Nord CE 3 Lite',
    ],
    Xiaomi: [
      'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14', 'Xiaomi 14T Pro', 'Xiaomi 14T',
      'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13', 'Xiaomi 13T Pro', 'Xiaomi 13T',
      'Redmi Note 13 Pro+ 5G', 'Redmi Note 13 Pro 5G', 'Redmi Note 13 Pro',
      'Redmi Note 13 5G', 'Redmi Note 13', 'Redmi Note 12 Pro+',
      'Redmi 13C', 'Redmi 13', 'Redmi 12', 'Redmi A3', 'Redmi A2',
      'POCO X6 Pro', 'POCO X6', 'POCO M6 Pro', 'POCO M6 5G',
      'POCO F6 Pro', 'POCO F6', 'POCO C65', 'POCO C55',
    ],
  },
};

export const DeviceInfoForm = ({ onDeviceInfoSubmit }) => {
  const [deviceInfo, setDeviceInfo] = useState({ type: '', brand: '', model: '' });

  const handleTypeChange = (e) => {
    setDeviceInfo({ type: e.target.value, brand: '', model: '' });
  };

  const handleBrandChange = (e) => {
    setDeviceInfo((prev) => ({ ...prev, brand: e.target.value, model: '' }));
  };

  const handleModelChange = (e) => {
    setDeviceInfo((prev) => ({ ...prev, model: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deviceInfo.type && deviceInfo.brand && deviceInfo.model) {
      onDeviceInfoSubmit(deviceInfo);
    }
  };

  const availableBrands = BRANDS[deviceInfo.type] || [];
  const availableModels = (MODELS[deviceInfo.type] || {})[deviceInfo.brand] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Device Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Device Type <span className="text-red-500">*</span>
        </label>
        <select
          value={deviceInfo.type}
          onChange={handleTypeChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select device type</option>
          {Object.keys(BRANDS).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand <span className="text-red-500">*</span>
        </label>
        <select
          value={deviceInfo.brand}
          onChange={handleBrandChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
          required
          disabled={!deviceInfo.type}
        >
          <option value="">Select brand</option>
          {availableBrands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model <span className="text-red-500">*</span>
        </label>
        <select
          value={deviceInfo.model}
          onChange={handleModelChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
          required
          disabled={!deviceInfo.brand}
        >
          <option value="">
            {!deviceInfo.brand ? 'Select a brand first' : 'Select model'}
          </option>
          {availableModels.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
        {deviceInfo.brand && availableModels.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">No models listed for this brand yet.</p>
        )}
      </div>

      {/* Selected summary */}
      {deviceInfo.type && deviceInfo.brand && deviceInfo.model && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <span className="font-semibold">Selected:</span>{' '}
          {deviceInfo.type} — {deviceInfo.brand} {deviceInfo.model}
        </div>
      )}

      <button
        type="submit"
        disabled={!(deviceInfo.type && deviceInfo.brand && deviceInfo.model)}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Continue to Symptoms →
      </button>
    </form>
  );
};
/**
 * Location Converter for Admin Dashboard
 * Converts Bangla location names to English for API compatibility
 * 
 * Display: Bangla (user-friendly)
 * Storage: English (backend compatibility)
 */

// Comprehensive Bangla → English mapping
const BANGLA_TO_ENGLISH_MAP: Record<string, string> = {
  // Divisions
  'ঢাকা': 'Dhaka',
  'চট্টগ্রাম': 'Chittagong',
  'রাজশাহী': 'Rajshahi',
  'খুলনা': 'Khulna',
  'বরিশাল': 'Barisal',
  'সিলেট': 'Sylhet',
  'রংপুর': 'Rangpur',
  'ময়মনসিংহ': 'Mymensingh',
  
  // Dhaka Division Districts
  'গাজীপুর': 'Gazipur',
  'মানিকগঞ্জ': 'Manikganj',
  'মুন্সিগঞ্জ': 'Munshiganj',
  'নারায়ণগঞ্জ': 'Narayanganj',
  'নরসিংদী': 'Narsingdi',
  'ফরিদপুর': 'Faridpur',
  'কিশোরগঞ্জ': 'Kishoreganj',
  'টাঙ্গাইল': 'Tangail',
  
  // Dhaka District Upazilas
  'ধানমন্ডি': 'Dhanmondi',
  'গুলশান': 'Gulshan',
  'মিরপুর': 'Mirpur',
  'মোহাম্মদপুর': 'Mohammadpur',
  'উত্তরা': 'Uttara',
  'মতিঝিল': 'Motijheel',
  'তেজগাঁও': 'Tejgaon',
  'ডেমরা': 'Demra',
  'খিলগাঁও': 'Khilgaon',
  'লালবাগ': 'Lalbagh',
  
  // Gazipur Upazilas
  'গাজীপুর সদর': 'Gazipur Sadar',
  'কালিয়াকৈর': 'Kaliakair',
  'কালীগঞ্জ': 'Kaliganj',
  'কাপাসিয়া': 'Kapasia',
  'শ্রীপুর': 'Sreepur',
  
  // Chittagong Division Districts
  'কক্সবাজার': 'Cox\'s Bazar',
  'কুমিল্লা': 'Comilla',
  'ফেনী': 'Feni',
  'নোয়াখালী': 'Noakhali',
  'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria',
  'চাঁদপুর': 'Chandpur',
  'লক্ষ্মীপুর': 'Lakshmipur',
  'রাঙ্গামাটি': 'Rangamati',
  'বান্দরবান': 'Bandarban',
  'খাগড়াছড়ি': 'Khagrachari',
  
  // Chittagong District Upazilas
  'চাঁদগাঁও': 'Chandgaon',
  'ডাবল মুরিং': 'Double Mooring',
  'হালিশহর': 'Halishahar',
  'খুলশী': 'Khulshi',
  'কোতোয়ালী': 'Kotwali',
  'পাহাড়তলী': 'Pahartali',
  'পাঁচলাইশ': 'Panchlaish',
  'পতেঙ্গা': 'Patenga',
  'বায়েজিদ': 'Bayazid',
  'বাকলিয়া': 'Bakalia',
  
  // Rajshahi Division Districts
  'বগুড়া': 'Bogura',
  'নাটোর': 'Natore',
  'নওগাঁ': 'Naogaon',
  'পাবনা': 'Pabna',
  'সিরাজগঞ্জ': 'Sirajganj',
  'চাঁপাইনবাবগঞ্জ': 'Chapainawabganj',
  'জয়পুরহাট': 'Joypurhat',
  
  // Rajshahi District Upazilas
  'বোয়ালিয়া': 'Boalia',
  'মতিহার': 'Motihar',
  'রাজপাড়া': 'Rajpara',
  'শাহ মখদুম': 'Shah Makhdum',
  'বাঘা': 'Bagha',
  'বাগমারা': 'Bagmara',
  'চারঘাট': 'Charghat',
  'দুর্গাপুর': 'Durgapur',
  'গোদাগাড়ী': 'Godagari',
  'মোহনপুর': 'Mohanpur',
  'পবা': 'Paba',
  'পুঠিয়া': 'Puthia',
  'তানোর': 'Tanore',
  
  // Khulna Division Districts
  'যশোর': 'Jessore',
  'সাতক্ষীরা': 'Satkhira',
  'বাগেরহাট': 'Bagerhat',
  'কুষ্টিয়া': 'Kushtia',
  'মাগুরা': 'Magura',
  'মেহেরপুর': 'Meherpur',
  'চুয়াডাঙ্গা': 'Chuadanga',
  'নড়াইল': 'Narail',
  'ঝিনাইদহ': 'Jhenaidah',
  
  // Khulna District Upazilas
  'দৌলতপুর': 'Daulatpur',
  'খান জাহান আলী': 'Khan Jahan Ali',
  'খুলনা সদর': 'Khulna Sadar',
  'সোনাডাঙ্গা': 'Sonadanga',
  'বটিয়াঘাটা': 'Batiaghata',
  'ডাকোপ': 'Dacope',
  'ডুমুরিয়া': 'Dumuria',
  'দিঘলিয়া': 'Dighalia',
  'কয়রা': 'Koyra',
  'পাইকগাছা': 'Paikgachha',
  'ফুলতলা': 'Phultala',
  'রূপসা': 'Rupsa',
  'তেরখাদা': 'Terokhada',
  
  // Barisal Division Districts
  'ভোলা': 'Bhola',
  'পটুয়াখালী': 'Patuakhali',
  'পিরোজপুর': 'Pirojpur',
  'ঝালকাঠি': 'Jhalokati',
  'বরগুনা': 'Barguna',
  
  // Barisal District Upazilas
  'বরিশাল সদর': 'Barisal Sadar',
  'আগৈলঝাড়া': 'Agailjhara',
  'বাবুগঞ্জ': 'Babuganj',
  'বাকেরগঞ্জ': 'Bakerganj',
  'বানারীপাড়া': 'Banaripara',
  'গৌরনদী': 'Gaurnadi',
  'হিজলা': 'Hizla',
  'মেহেন্দিগঞ্জ': 'Mehendiganj',
  'মুলাদী': 'Muladi',
  'ওয়াজিরপুর': 'Wazirpur',
  
  // Sylhet Division Districts
  'মৌলভীবাজার': 'Moulvibazar',
  'হবিগঞ্জ': 'Habiganj',
  'সুনামগঞ্জ': 'Sunamganj',
  
  // Sylhet District Upazilas
  'সিলেট সদর': 'Sylhet Sadar',
  'বিয়ানীবাজার': 'Beanibazar',
  'বিশ্বনাথ': 'Bishwanath',
  'কোম্পানীগঞ্জ': 'Companiganj',
  'ফেঞ্চুগঞ্জ': 'Fenchuganj',
  'গোলাপগঞ্জ': 'Golapganj',
  'গোয়াইনঘাট': 'Gowainghat',
  'জৈন্তাপুর': 'Jaintiapur',
  'কানাইঘাট': 'Kanaighat',
  'ওসমানী নগর': 'Osmani Nagar',
  'দক্ষিণ সুরমা': 'South Surma',
  'জকিগঞ্জ': 'Zakiganj',
  
  // Rangpur Division Districts
  'দিনাজপুর': 'Dinajpur',
  'গাইবান্ধা': 'Gaibandha',
  'কুড়িগ্রাম': 'Kurigram',
  'লালমনিরহাট': 'Lalmonirhat',
  'নীলফামারী': 'Nilphamari',
  'পঞ্চগড়': 'Panchagarh',
  'ঠাকুরগাঁও': 'Thakurgaon',
  
  // Rangpur District Upazilas
  'রংপুর সদর': 'Rangpur Sadar',
  'বদরগঞ্জ': 'Badarganj',
  'গঙ্গাচড়া': 'Gangachara',
  'কাউনিয়া': 'Kaunia',
  'মিঠাপুকুর': 'Mithapukur',
  'পীরগাছা': 'Pirgachha',
  'পীরগঞ্জ': 'Pirganj',
  'তারাগঞ্জ': 'Taraganj',
  
  // Mymensingh Division Districts
  'জামালপুর': 'Jamalpur',
  'নেত্রকোনা': 'Netrokona',
  'শেরপুর': 'Sherpur',
  
  // Mymensingh District Upazilas
  'ময়মনসিংহ সদর': 'Mymensingh Sadar',
  'ভালুকা': 'Bhaluka',
  'ধোবাউড়া': 'Dhobaura',
  'ফুলবাড়িয়া': 'Fulbaria',
  'গফরগাঁও': 'Gaffargaon',
  'গৌরীপুর': 'Gauripur',
  'হালুয়াঘাট': 'Haluaghat',
  'ঈশ্বরগঞ্জ': 'Ishwarganj',
  'মুক্তাগাছা': 'Muktagachha',
  'নান্দাইল': 'Nandail',
  'ফুলপুর': 'Phulpur',
  'ত্রিশাল': 'Trishal',
  
  // Add more as needed...
};

/**
 * Convert Bangla location name to English
 * Returns English name if found, otherwise returns original value
 */
export function convertBanglaToEnglish(banglaName: string | undefined): string | undefined {
  if (!banglaName || banglaName.trim() === '') return undefined;
  return BANGLA_TO_ENGLISH_MAP[banglaName] || banglaName;
}

/**
 * Convert location object from Bangla to English
 * Used when saving banner data to backend
 */
export function convertLocationToEnglish(location: {
  division?: string;
  district?: string;
  upazila?: string;
}): {
  division?: string;
  district?: string;
  upazila?: string;
} | undefined {
  const { division, district, upazila } = location;
  
  // If no division, return undefined (global banner)
  if (!division) return undefined;
  
  const divisionEnglish = convertBanglaToEnglish(division);
  const districtEnglish = convertBanglaToEnglish(district);
  const upazilaEnglish = convertBanglaToEnglish(upazila);
  
  console.log('📍 Location Converter: Bangla → English');
  console.log(`   Division: ${division} → ${divisionEnglish}`);
  console.log(`   District: ${district} → ${districtEnglish}`);
  console.log(`   Upazila: ${upazila} → ${upazilaEnglish}`);
  
  return {
    division: divisionEnglish,
    district: districtEnglish,
    upazila: upazilaEnglish,
  };
}

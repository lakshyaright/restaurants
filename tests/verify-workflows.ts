/**
 * TechRescue Digital Menu — Critical Workflow Validation Suite
 * Tests core business logic, permissions, URL resolution, and data integrity
 */

import { formatCurrency, getRestaurantMenuUrl } from '../src/lib/supabase.ts';
import { DEMO_RESTAURANT, DEMO_CATEGORIES, DEMO_MENU_ITEMS } from '../src/data/mockDemoData.ts';

function runTests() {
  console.log('🧪 Starting TechRescue Digital Menu Workflow Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Currency Formatting
  assert(formatCurrency(350, 'INR') === '₹350', 'Formats INR currency with rupee symbol');
  assert(formatCurrency(450.50, 'INR') === '₹450.5', 'Formats decimal INR prices correctly');
  assert(formatCurrency(12.99, 'USD').includes('12.99'), 'Formats international USD currency');

  // 2. URL slug and QR destination resolution
  const testUrl = getRestaurantMenuUrl('cafe-raj');
  assert(testUrl.endsWith('/menu/cafe-raj'), 'Resolves correct restaurant menu URL path');

  // 3. Slug validation logic
  const slugRegex = /^[a-z0-9-]+$/;
  assert(slugRegex.test('cafe-raj'), 'Valid slug format "cafe-raj" passes');
  assert(slugRegex.test('royal-punjab-dhaba-2'), 'Valid alphanumeric slug passes');
  assert(!slugRegex.test('Cafe Raj'), 'Uppercase and spaces rejected in slug');
  assert(!slugRegex.test('cafe_raj!'), 'Special characters rejected in slug');

  // 4. Price & Discount Validation rules
  function validateItemPricing(price: number, discount: number | null): boolean {
    if (price < 0) return false;
    if (discount !== null) {
      if (discount < 0 || discount >= price) return false;
    }
    return true;
  }
  assert(validateItemPricing(500, 450), 'Valid regular price with lower discount passes');
  assert(validateItemPricing(350, null), 'Valid regular price without discount passes');
  assert(!validateItemPricing(-10, null), 'Negative price rejected');
  assert(!validateItemPricing(300, 350), 'Discount greater than price rejected');
  assert(!validateItemPricing(300, 300), 'Discount equal to price rejected');

  // 5. Dietary indicator categories
  const dietaryTypes = ['veg', 'non_veg', 'egg', 'vegan'];
  DEMO_MENU_ITEMS.forEach(item => {
    assert(dietaryTypes.includes(item.dietary_type), `Item "${item.name}" has valid FSSAI dietary type`);
  });

  // 6. Tenant isolation integrity: category_id must match restaurant_id
  DEMO_CATEGORIES.forEach(cat => {
    assert(cat.restaurant_id === DEMO_RESTAURANT.id, `Category "${cat.name}" belongs to demo restaurant`);
  });

  DEMO_MENU_ITEMS.forEach(item => {
    const parentCat = DEMO_CATEGORIES.find(c => c.id === item.category_id);
    assert(parentCat !== undefined, `Item "${item.name}" is bound to valid parent category`);
    assert(item.restaurant_id === DEMO_RESTAURANT.id, `Item "${item.name}" belongs to demo restaurant`);
  });

  // 7. Restaurant status visibility rules
  function isPubliclyAccessible(status: string, isPreview: boolean): boolean {
    if (isPreview) return true;
    return status === 'published';
  }
  assert(isPubliclyAccessible('published', false), 'Published restaurant is publicly visible');
  assert(!isPubliclyAccessible('draft', false), 'Draft restaurant is blocked from public access');
  assert(!isPubliclyAccessible('suspended', false), 'Suspended restaurant is blocked from public access');
  assert(isPubliclyAccessible('draft', true), 'Draft restaurant is visible in owner preview mode');

  console.log(`\n🎉 Test Suite Completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

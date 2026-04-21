<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $gamingCategory = \App\Models\Category::create([
            'slug' => 'gaming',
            'eyebrow_en' => 'Section 1', 'eyebrow_ar' => 'القسم 1',
            'title_en' => 'Gaming Laptops (OMEN & Victus)', 'title_ar' => 'لابتوبات الألعاب (OMEN و Victus)',
            'note_en' => 'High-performance machines with dedicated NVIDIA RTX graphics.', 'note_ar' => 'أجهزة عالية الأداء مزودة ببطاقات NVIDIA RTX منفصلة.',
            'badge_en' => 'Gaming', 'badge_ar' => 'الألعاب',
            'detail_label_en' => 'Graphics', 'detail_label_ar' => 'الرسوميات'
        ]);

        $gamingCategory->laptops()->createMany([
            ['asin' => 'B0FVXTK69T', 'model' => 'OMEN MAX 16-ah0016ne', 'processor' => 'Ultra 7-255HX', 'storage' => '32GB / 1TB SSD', 'detail' => 'RTX 5070 Ti (12GB)', 'price' => '129,999'],
            ['asin' => 'B0GMBSC1ZX', 'model' => 'OMEN MAX 16-ak0007ne', 'processor' => 'Ryzen AI 7 350', 'storage' => '16GB / 512GB SSD', 'detail' => 'RTX 5060 (8GB)', 'price' => '86,999'],
            ['asin' => 'B0GMBRZ9P9', 'model' => 'OMEN 16-am0025ne', 'processor' => 'Ultra 7-255H', 'storage' => '16GB / 1TB SSD', 'detail' => 'RTX Graphics', 'price' => '79,499'],
            ['asin' => 'B0CNKJWK32', 'model' => 'Victus 15-Performance', 'processor' => 'i5-13500H', 'storage' => '16GB / 512GB SSD', 'detail' => 'RTX 3050 (6GB)', 'price' => '36,000'],
            ['asin' => 'B0FVXZBTZK', 'model' => 'Victus 15-fb3014ne', 'processor' => 'Ryzen 7-7445HS', 'storage' => '16GB / 512GB SSD', 'detail' => 'RTX 2050 (4GB)', 'price' => '49,999'],
            ['asin' => 'B0DDS88LHX', 'model' => 'Victus 15-fa1039ne', 'processor' => 'i7-13700H', 'storage' => '8GB / 512GB SSD', 'detail' => 'RTX 3050 (6GB)', 'price' => '47,299'],
            ['asin' => 'B0CYNCBCWM', 'model' => 'Victus 15-fb0034ne', 'processor' => 'Ryzen 7-5800H', 'storage' => '16GB / 512GB SSD', 'detail' => 'RTX 3050 (4GB)', 'price' => '44,999']
        ]);

        $businessCategory = \App\Models\Category::create([
            'slug' => 'business',
            'eyebrow_en' => 'Section 2', 'eyebrow_ar' => 'القسم 2',
            'title_en' => 'Business & Premium AI PCs (ProBook & OmniBook)', 'title_ar' => 'أجهزة الأعمال والذكاء الاصطناعي (ProBook و OmniBook)',
            'note_en' => 'Laptops optimized for professional use, mobility, and AI features.', 'note_ar' => 'لابتوبات مهيأة للاستخدام المهني والحركة وميزات الذكاء الاصطناعي.',
            'badge_en' => 'Business', 'badge_ar' => 'الأعمال',
            'detail_label_en' => 'Notable specs', 'detail_label_ar' => 'المواصفات البارزة'
        ]);

        $businessCategory->laptops()->createMany([
            ['asin' => 'B0DX73HR5L', 'model' => 'ProBook 460 G11', 'processor' => 'Ultra 5 125U', 'storage' => '32GB / 256GB SSD', 'detail' => '16-inch WUXGA / Win 11 Pro', 'price' => '88,888'],
            ['asin' => 'B0DT9WKDZF', 'model' => 'ProBook 460 G11', 'processor' => 'Ultra 7 155H', 'storage' => '32GB / 1TB SSD', 'detail' => '16-inch WUXGA / Win 11 Pro', 'price' => '97,777'],
            ['asin' => 'B0GC1VT5YS', 'model' => 'ProBook 460 G11', 'processor' => 'Ultra 5 125U', 'storage' => '8GB / 512GB SSD', 'detail' => '16-inch / FreeDOS', 'price' => '55,555'],
            ['asin' => 'B0G711KB9M', 'model' => 'ProBook 460 G11', 'processor' => 'Ultra 7 155U', 'storage' => '8GB / 512GB SSD', 'detail' => '16-inch / FreeDOS', 'price' => '44,999'],
            ['asin' => 'B0D5ZKHBXR', 'model' => 'OmniBook X 14', 'processor' => 'Snapdragon X Elite', 'storage' => '16GB / 512GB SSD', 'detail' => '2.2K Touch / AI NPU', 'price' => '72,999'],
            ['asin' => 'B0F9LKZJS1', 'model' => 'ProBook 460 G11', 'processor' => 'Ultra 7 155U', 'storage' => '32GB / 1TB SSD', 'detail' => '16-inch / Win 11 Pro', 'price' => '89,999'],
            ['asin' => 'B0D4F8MZX1', 'model' => 'ProBook 460 G11', 'processor' => 'Ultra 7 155U', 'storage' => '16GB / 512GB SSD', 'detail' => '16-inch / Win 11', 'price' => '78,666', 'noon_price' => '78,500', 'noon_url' => 'https://www.noon.com/egypt-en/...'],
            ['asin' => 'B0FW124C4S', 'model' => 'OmniBook 5 Flip', 'processor' => 'i5-1334U', 'storage' => '8GB / 512GB SSD', 'detail' => '14-inch 2K Touch / 2-in-1', 'price' => '37,777'],
            ['asin' => 'B0FVWGTYHJ', 'model' => 'OmniBook 3 AI', 'processor' => 'Ryzen AI 5 330', 'storage' => '16GB / 512GB SSD', 'detail' => '15.6-inch FHD / 300 nits', 'price' => '36,600']
        ]);

        $everydayCategory = \App\Models\Category::create([
            'slug' => 'everyday',
            'eyebrow_en' => 'Section 3', 'eyebrow_ar' => 'القسم 3',
            'title_en' => 'Home & Everyday Laptops', 'title_ar' => 'لابتوبات المنزل والاستخدام اليومي',
            'note_en' => 'General-purpose laptops for students or office work.', 'note_ar' => 'أجهزة عامة للطلاب أو للعمل المكتبي.',
            'badge_en' => 'Everyday', 'badge_ar' => 'اليومي',
            'detail_label_en' => 'Notes', 'detail_label_ar' => 'ملاحظات'
        ]);

        $everydayCategory->laptops()->createMany([
            ['asin' => 'B0FVZD2Y4B', 'model' => 'HP Laptop AI 15', 'processor' => 'Ultra 7-255U', 'storage' => '16GB / 1TB SSD', 'detail' => 'Includes BT Mouse', 'price' => '43,999'],
            ['asin' => 'B09PJS53MV', 'model' => 'HP 15-dw3023ne', 'processor' => 'i5-1135G7', 'storage' => '8GB / 512GB SSD', 'detail' => '2GB Dedicated GPU', 'price' => '29,999'],
            ['asin' => 'B09XTX2GM4', 'model' => 'HP 15-DW1380NIA', 'processor' => 'i5-10210U', 'storage' => '4GB / 1TB HDD', 'detail' => 'Black / Win 11 Home', 'price' => '24,999'],
            ['asin' => 'B0C53R1BYL', 'model' => 'HP 15s-EQ2014NE', 'processor' => 'Ryzen 5-5500U', 'storage' => '4GB / 256GB SSD', 'detail' => 'Dos / Black', 'price' => '23,999']
        ]);

        \App\Models\Article::create([
            'role' => 'dev', 'date_en' => 'April 2026', 'date_ar' => 'أبريل 2026',
            'title_en' => 'Full-Stack HP: Scaffolding Laravel & React', 'title_ar' => 'HP للمبرمجين: تطوير Laravel و React',
            'desc_en' => 'We test which HP lines handle simultaneous Docker containers and Scrapy engines without thermal throttling.', 'desc_ar' => 'نختبر أي فئات HP تتعامل مع بيئات Docker ومحركات Scrapy المتزامنة دون تقليل الأداء بسبب الحرارة.',
            'bench_en' => 'React Build Time: OMEN 16 (4.2s) vs. Pavilion (9.1s).', 'bench_ar' => 'وقت بناء React: OMEN 16 (4.2 ثانية) مقابل Pavilion (9.1 ثانية).',
            'tip_en' => '📈 Dev Tip: Prioritize 16GB+ RAM for Docker stability in local environments.', 'tip_ar' => '📈 نصيحة برمجية: أعطالأولوية لـ 16GB+ RAM لاستقرار Docker في البيئات المحلية.'
        ]);

        \App\Models\Article::create([
            'role' => 'eng', 'date_en' => 'April 2026', 'date_ar' => 'أبريل 2026',
            'title_en' => 'Engineering in Heat: Victus Thermal Report', 'title_ar' => 'الهندسة في الحرارة: تقرير حرارة Victus',
            'desc_en' => 'How HP Victus handles 3D rendering during Egyptian summer peaks (35°C+ ambient).', 'desc_ar' => 'كيفيتعامل HP Victus مع الرندر ثلاثي الأبعاد أثناء ذروة الصيف المصري (35 درجة مئوية+).',
            'bench_en' => 'Thermal Test: Stable 80°C under 2-hour AutoCAD render session.', 'bench_ar' => 'اختبار الحرارة: استقرار عند 80 درجة مئوية تحت رندر AutoCAD لمدة ساعتين.',
            'tip_en' => '📈 Student Tip: HP Victus has the highest local repairability score in Cairo/Alex.', 'tip_ar' => '📈 نصيحة طالب: يتمتع HP Victus بأعلى درجة قابلية للإصلاح محلياً في القاهرة والإسكندرية.'
        ]);

        \App\Models\Article::create([
            'role' => 'design', 'date_en' => 'April 2026', 'date_ar' => 'أبريل 2026',
            'title_en' => 'Display Accuracy for Visual Designers', 'title_ar' => 'دقة الشاشة للمصممين المحترفين',
            'desc_en' => 'Testing color gamuts for Adobe Animate and Affinity Designer workflow.', 'desc_ar' => 'اختبار تدرج الألوان لسير عمل Adobe Animate و Affinity Designer.',
            'bench_en' => 'Color Accuracy: 100% sRGB verified on OMEN 17 and OmniBook X.', 'bench_ar' => 'دقة الألوان: تم التحقق من 100% sRGB في OMEN 17 و OmniBook X.',
            'tip_en' => '📈 Pro Tip: Avoid \'Basic\' 45% NTSC screens for professional vector work.', 'tip_ar' => '📈 نصيحة احترافية: تجنب شاشات 45% NTSC للأعمال الفنية المتجهة (Vector).'
        ]);
    }
}

import React from 'react';
import { SettingsIcon, CheckCircleIcon } from './Icons';
import Card from './Card';

const CodeBlock = ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm text-left">
        <code>{children}</code>
    </pre>
);

const supabaseConfigPlaceholder = `
// services/supabaseConfig.ts

// BU ALANLARI KENDİ BİLGİLERİNİZLE DEĞİŞTİRİN
export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
`;

const SetupWizard = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-3xl">
                <div className="text-center">
                    <SettingsIcon className="w-16 h-16 mx-auto text-primary-500" />
                    <h1 className="text-3xl font-bold mt-4">Uygulama Kurulumu Gerekli</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Başlamadan önce uygulamanızı bir Supabase projesine bağlamanız gerekmektedir.
                    </p>
                </div>

                <div className="mt-8 space-y-6 text-left">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center">
                            <span className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3">1</span>
                            Supabase Proje Bilgilerinizi Alın
                        </h2>
                        <ul className="list-disc list-inside mt-2 ml-9 text-gray-600 dark:text-gray-300 space-y-1">
                            <li>Supabase.com'da bir proje oluşturun.</li>
                            <li>Proje panelinde, sol menüdeki dişli çark (⚙️) simgesine tıklayıp <strong>API</strong>'yı seçin.</li>
                            <li>"Project API keys" bölümünde, <strong>Project URL</strong>'nizi ve <strong><code>anon</code> <code>public</code></strong> anahtarınızı kopyalayın.</li>
                        </ul>
                    </div>
                     <div>
                        <h2 className="text-lg font-semibold flex items-center">
                             <span className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3">2</span>
                            Yapılandırmayı Koda Ekleyin
                        </h2>
                        <p className="mt-2 ml-9 text-gray-600 dark:text-gray-300">
                           Projenizin kod dosyaları içinde <code>services/supabaseConfig.ts</code> dosyasını açın ve kopyaladığınız URL ve anahtarı ilgili alanlara yapıştırın.
                        </p>
                         <div className="mt-4 ml-9">
                            <CodeBlock>{supabaseConfigPlaceholder}</CodeBlock>
                        </div>
                    </div>
                     <div>
                        <h2 className="text-lg font-semibold flex items-center">
                             <span className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3">3</span>
                            Veritabanı Tablolarını Oluşturun
                        </h2>
                         <p className="mt-2 ml-9 text-gray-600 dark:text-gray-300">
                           Proje ana klasöründeki <code>README.md</code> dosyasında bulunan SQL kodunu Supabase projenizin <strong>SQL Editor</strong> bölümüne yapıştırıp çalıştırın. Bu, uygulama için gerekli tüm tabloları oluşturacaktır.
                        </p>
                    </div>
                     <div>
                        <h2 className="text-lg font-semibold flex items-center">
                            <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3"/>
                            Tamamlayın ve Yeniden Deneyin
                        </h2>
                         <p className="mt-2 ml-9 text-gray-600 dark:text-gray-300">
                           Tüm adımları tamamladıktan sonra sayfayı yenileyin. Uygulama otomatik olarak başlayacaktır.
                        </p>
                        <div className="mt-4 ml-9">
                             <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold"
                            >
                                Sayfayı Yenile ve Yeniden Dene
                            </button>
                        </div>
                    </div>
                </div>

            </Card>
        </div>
    );
};

export default SetupWizard;
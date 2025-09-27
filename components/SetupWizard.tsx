
import React from 'react';
import { SettingsIcon, CheckCircleIcon } from './Icons';
import Card from './Card';

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
        <code>{children}</code>
    </pre>
);

const firebaseConfigPlaceholder = `
// services/firebase.ts

// ...

export const firebaseConfig = {
  apiKey: "AIzaSyA...",
  authDomain: "proje-adi.firebaseapp.com",
  projectId: "proje-adi",
  storageBucket: "proje-adi.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// ...
`;

const SetupWizard = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-3xl">
                <div className="text-center">
                    <SettingsIcon className="w-16 h-16 mx-auto text-primary-500" />
                    <h1 className="text-3xl font-bold mt-4">Uygulama Kurulumu Gerekli</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Başlamadan önce uygulamanızı bir Firebase projesine bağlamanız gerekmektedir.
                    </p>
                </div>

                <div className="mt-8 space-y-6 text-left">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center">
                            <span className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3">1</span>
                            Firebase Proje Bilgilerinizi Alın
                        </h2>
                        <ul className="list-disc list-inside mt-2 ml-9 text-gray-600 dark:text-gray-300 space-y-1">
                            <li>Firebase Konsolu'nda projenizi açın.</li>
                            <li>Sol üstteki dişli çark (⚙️) simgesine tıklayıp <strong>Proje Ayarları</strong>'nı seçin.</li>
                            <li><strong>Genel</strong> sekmesinde, "Uygulamalarınız" bölümüne gidin.</li>
                            <li>"SDK kurulumu ve yapılandırması" altından <strong>Yapılandırma (Config)</strong>'yı seçin.</li>
                            <li><code>firebaseConfig</code> nesnesini kopyalayın.</li>
                        </ul>
                    </div>
                     <div>
                        <h2 className="text-lg font-semibold flex items-center">
                             <span className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3">2</span>
                            Yapılandırmayı Koda Ekleyin
                        </h2>
                        <p className="mt-2 ml-9 text-gray-600 dark:text-gray-300">
                           Projenizin kod dosyaları içinde <code>services/firebase.ts</code> dosyasını açın ve kopyaladığınız <code>firebaseConfig</code> nesnesini mevcut olanla değiştirin.
                        </p>
                         <div className="mt-4 ml-9">
                            <CodeBlock>{firebaseConfigPlaceholder}</CodeBlock>
                        </div>
                    </div>
                     <div>
                        <h2 className="text-lg font-semibold flex items-center">
                            <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3"/>
                            Tamamlayın ve Yeniden Deneyin
                        </h2>
                         <p className="mt-2 ml-9 text-gray-600 dark:text-gray-300">
                           Değişikliği yaptıktan sonra sayfayı yenileyin. Uygulama otomatik olarak başlayacaktır.
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

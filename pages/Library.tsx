
import React from 'react';
import Card from '../components/Card';
import { useDataContext } from '../contexts/DataContext';
import { ChecklistItem } from '../types';

const TemplateCard = ({ template }: { template: { id: string; title: string; description: string; checklist: Omit<ChecklistItem, 'id'|'isCompleted'>[] } }) => (
    <Card>
        <h4 className="font-bold text-primary-600 dark:text-primary-400">{template.title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{template.description}</p>
        {template.checklist.length > 0 && (
            <div className="mt-4">
                <h5 className="text-xs font-semibold uppercase text-gray-400">Kontrol Listesi</h5>
                <ul className="mt-2 space-y-1 text-sm">
                    {template.checklist.map((item, index) => (
                        <li key={index} className="flex items-center">
                           <span className="mr-2">☑</span> {item.text}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </Card>
);

const ResourceCard = ({ resource }: { resource: { id: string; name: string; type: string; url: string } }) => {
    const typeIcons = {
        pdf: '📄',
        link: '🔗',
        video: '🎬',
    };
    return (
        <Card>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group">
                <span className="text-2xl">{typeIcons[resource.type as keyof typeof typeIcons]}</span>
                <div>
                    <h4 className="font-semibold group-hover:text-primary-500">{resource.name}</h4>
                    <p className="text-xs text-gray-500 uppercase">{resource.type}</p>
                </div>
            </a>
        </Card>
    )
};

const Library = () => {
    const { templates, resources } = useDataContext();
    const [activeTab, setActiveTab] = React.useState('templates');

    return (
        <div className="space-y-6">
            <div>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`${activeTab === 'templates' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Ödev Şablonları
                        </button>
                        <button
                             onClick={() => setActiveTab('resources')}
                            className={`${activeTab === 'resources' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Kaynaklar
                        </button>
                    </nav>
                </div>
            </div>

            {activeTab === 'templates' && (
                <div>
                     <h2 className="text-2xl font-bold mb-4">Ödev Şablonları</h2>
                     {templates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map(template => <TemplateCard key={template.id} template={template} />)}
                        </div>
                     ) : (
                        <Card>
                            <div className="text-center py-10">
                                <h3 className="text-lg font-semibold">Henüz ödev şablonu oluşturulmadı.</h3>
                                <p className="text-gray-500 mt-2">Gelecekte hızlıca ödev atamak için buraya şablonlar ekleyebilirsiniz.</p>
                            </div>
                        </Card>
                     )}
                </div>
            )}
             {activeTab === 'resources' && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Kaynaklar</h2>
                    {resources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.map(resource => <ResourceCard key={resource.id} resource={resource} />)}
                        </div>
                    ) : (
                         <Card>
                            <div className="text-center py-10">
                                <h3 className="text-lg font-semibold">Henüz kaynak eklenmedi.</h3>
                                <p className="text-gray-500 mt-2">Öğrencilerinizle paylaşmak için PDF, video veya bağlantı gibi kaynakları buraya ekleyin.</p>
                            </div>
                        </Card>
                    )}
                </div>
            )}

        </div>
    );
};

export default Library;
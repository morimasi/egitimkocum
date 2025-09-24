import React, { useState } from 'react';
import Card from '../components/Card';
import { useDataContext } from '../contexts/DataContext';
import { ChecklistItem, Resource, User, UserRole } from '../types';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';

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

const RecommendModal = ({ resource, onClose }: { resource: Resource; onClose: () => void }) => {
    const { students, toggleResourceRecommendation } = useDataContext();
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`"${resource.name}" Kaynağını Öner`}>
            <div className="max-h-80 overflow-y-auto">
                <p className="text-sm text-gray-500 mb-4">Bu kaynağı önermek istediğiniz öğrencileri seçin.</p>
                <ul className="space-y-2">
                    {students.map(student => {
                        const isRecommended = resource.recommendedTo?.includes(student.id);
                        return (
                            <li key={student.id}>
                                <label className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRecommended}
                                        onChange={() => toggleResourceRecommendation(resource.id, student.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <img src={student.profilePicture} alt={student.name} className="w-8 h-8 rounded-full mx-3"/>
                                    <span className="font-medium">{student.name}</span>
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </Modal>
    );
};


const ResourceCard = ({ resource }: { resource: { id: string; name: string; type: string; url: string, recommendedTo?: string[] } }) => {
    const { currentUser } = useDataContext();
    const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
    
    const typeIcons = {
        pdf: '📄',
        link: '🔗',
        video: '🎬',
    };
    
    return (
        <>
        <Card>
            <div className="flex flex-col h-full">
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group flex-grow">
                    <span className="text-2xl">{typeIcons[resource.type as keyof typeof typeIcons]}</span>
                    <div>
                        <h4 className="font-semibold group-hover:text-primary-500">{resource.name}</h4>
                        <p className="text-xs text-gray-500 uppercase">{resource.type}</p>
                    </div>
                </a>
                {currentUser?.role === UserRole.Coach && (
                    <div className="mt-4 pt-3 border-t dark:border-gray-700 text-right">
                        <button onClick={() => setIsRecommendModalOpen(true)} className="text-sm font-semibold text-primary-600 hover:underline">
                            Öner ({resource.recommendedTo?.length || 0})
                        </button>
                    </div>
                )}
            </div>
        </Card>
        {isRecommendModalOpen && <RecommendModal resource={resource as Resource} onClose={() => setIsRecommendModalOpen(false)} />}
        </>
    )
};

const Library = () => {
    const { templates, resources, currentUser } = useDataContext();
    const [activeTab, setActiveTab] = useState('templates');
    const isStudent = currentUser?.role === UserRole.Student;

    const recommendedResources = resources.filter(r => r.recommendedTo?.includes(currentUser?.id || ''));

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
                            Tüm Kaynaklar
                        </button>
                        {isStudent && (
                             <button
                                onClick={() => setActiveTab('recommended')}
                                className={`${activeTab === 'recommended' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
                            >
                                Bana Önerilenler
                                {recommendedResources.length > 0 && <span className="absolute top-2 -right-3 ml-2 bg-primary-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{recommendedResources.length}</span>}
                            </button>
                        )}
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
                    <h2 className="text-2xl font-bold mb-4">Tüm Kaynaklar</h2>
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
            {activeTab === 'recommended' && isStudent && (
                 <div>
                    <h2 className="text-2xl font-bold mb-4">Bana Önerilenler</h2>
                    {recommendedResources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedResources.map(resource => <ResourceCard key={resource.id} resource={resource} />)}
                        </div>
                    ) : (
                         <Card>
                            <div className="text-center py-10">
                                <h3 className="text-lg font-semibold">Henüz size özel bir kaynak önerilmedi.</h3>
                                <p className="text-gray-500 mt-2">Koçunuz bir kaynak önerdiğinde burada görünecektir.</p>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default Library;
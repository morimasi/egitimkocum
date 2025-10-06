import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useDataContext } from '../contexts/DataContext';
import { Resource, UserRole, AcademicTrack, ResourceCategory } from '../types';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { DocumentIcon, LibraryIcon, LinkIcon, TrashIcon, VideoIcon, ImageIcon, AudioFileIcon, SpreadsheetIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import VideoRecorder from '../components/VideoRecorder';
import AudioRecorder from '../components/AudioRecorder';
import { ResourceCategoryLabels } from '../services/examCategories';

const getAcademicTrackLabel = (track: AcademicTrack): string => {
    switch (track) {
        case AcademicTrack.Sayisal: return 'Sayısal';
        case AcademicTrack.EsitAgirlik: return 'Eşit Ağırlık';
        case AcademicTrack.Sozel: return 'Sözel';
        case AcademicTrack.Dil: return 'Dil';
        default: return '';
    }
};

const AddResourceModal = ({ onClose }: { onClose: () => void }) => {
    const { addResource, uploadFile, currentUser, students } = useDataContext();
    const { addToast } = useUI();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState<Resource['type']>('link');
    const [category, setCategory] = useState<ResourceCategory>(ResourceCategory.Genel);
    const [isPublic, setIsPublic] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [filterGrade, setFilterGrade] = useState('all');
    const [mediaInputMethod, setMediaInputMethod] = useState<'upload' | 'record' | null>(null);

    const availableStudents = useMemo(() => {
        if (filterGrade === 'all') return students;
        return students.filter(s => s.gradeLevel === filterGrade);
    }, [students, filterGrade]);


    const handleTypeChange = (newType: Resource['type']) => {
        setType(newType);
        setUrl('');
        setFile(null);
        setMediaInputMethod(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name && !file) {
            addToast("Lütfen bir kaynak adı girin.", "error");
            return;
        }
        if (type === 'link' && !url) {
            addToast("Lütfen bir URL girin.", "error");
            return;
        }
        if (type !== 'link' && !file && !url) {
            addToast("Lütfen bir dosya seçin, kayıt yapın veya URL girin.", "error");
            return;
        }
        if (!isPublic && assignedTo.length === 0) {
            addToast("Lütfen özel kaynağı en az bir öğrenciye atayın.", "error");
            return;
        }
        if (!currentUser) return;

        setIsLoading(true);
        try {
            let resourceUrl = url;
            let resourceName = name;

            if (file) {
                if (!resourceName) {
                    resourceName = file.name;
                }
                // FIX: Removed the second argument from the uploadFile call
                resourceUrl = await uploadFile(file);
            }

            await addResource({ name: resourceName, url: resourceUrl, type, isPublic, uploaderId: currentUser.id, assignedTo: isPublic ? [] : assignedTo, category });
            addToast("Kaynak başarıyla eklendi.", "success");
            onClose();
        } catch (error) {
            console.error("Error adding resource:", error);
            addToast("Kaynak eklenirken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Kaynak Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Kaynak Adı</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={file ? file.name : "Örn: Türev Konu Anlatımı"} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Kategori</label>
                        <select value={category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as ResourceCategory)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            {Object.entries(ResourceCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Kaynak Türü</label>
                    <select value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTypeChange(e.target.value as Resource['type'])} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="link">Bağlantı</option>
                        <option value="video">Video</option>
                        <option value="audio">Ses Dosyası</option>
                        <option value="pdf">PDF</option>
                        <option value="image">Görsel</option>
                        <option value="document">Doküman</option>
                        <option value="spreadsheet">Hesap Tablosu</option>
                    </select>
                </div>
                
                {type === 'link' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">URL (Bağlantı)</label>
                        <input type="url" value={url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                )}

                {(type === 'video' || type === 'audio') && !mediaInputMethod && (
                    <div>
                        <label className="block text-sm font-medium mb-2">{type === 'video' ? 'Video Ekleme Yöntemi' : 'Ses Ekleme Yöntemi'}</label>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setMediaInputMethod('record')} className="flex-1 p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">Kayıt Yap</button>
                            <button type="button" onClick={() => setMediaInputMethod('upload')} className="flex-1 p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">Dosya Yükle</button>
                        </div>
                    </div>
                )}
                
                {((type === 'video' && mediaInputMethod === 'record') || (type === 'audio' && mediaInputMethod === 'record')) && (
                    <div>
                        <label className="block text-sm font-medium mb-1">{type === 'video' ? 'Video Kaydet' : 'Ses Kaydet'}</label>
                        {type === 'video' ? 
                            <VideoRecorder onSave={(url) => { if(url) setUrl(url) }} /> : 
                            <AudioRecorder onSave={(url) => { if(url) setUrl(url) }} />}
                        <button type="button" onClick={() => setMediaInputMethod(null)} className="text-xs mt-1 text-gray-500 hover:underline">Geri</button>
                    </div>
                )}
                
                {(type !== 'link' && (!mediaInputMethod || mediaInputMethod === 'upload')) && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Dosya Yükle</label>
                        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                        {(type === 'video' || type === 'audio') && mediaInputMethod === 'upload' && <button type="button" onClick={() => setMediaInputMethod(null)} className="text-xs mt-1 text-gray-500 hover:underline">Geri</button>}
                    </div>
                )}

                <div>
                    <label className="flex items-center">
                        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="ml-2 text-sm">Herkesle Paylaş</span>
                    </label>
                </div>

                {!isPublic && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Atanacak Öğrenciler</label>
                        <select
                            value={filterGrade}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                setFilterGrade(e.target.value);
                                setAssignedTo([]);
                            }}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mb-2"
                        >
                            <option value="all">Tüm Sınıflar</option>
                            <option value="9">9. Sınıf</option>
                            <option value="10">10. Sınıf</option>
                            <option value="11">11. Sınıf</option>
                            <option value="12">12. Sınıf</option>
                            <option value="mezun">Mezun</option>
                        </select>
                        <select multiple value={assignedTo} onChange={e => setAssignedTo(Array.from(e.target.selectedOptions, opt => opt.value))} className="w-full h-32 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                             {availableStudents.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isLoading}>İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50" disabled={isLoading}>
                        {isLoading ? 'Ekleniyor...' : 'Kaynağı Ekle'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
    const icons: Record<Resource['type'], React.ReactNode> = {
        'pdf': <DocumentIcon className="w-6 h-6 text-red-500" />,
        'link': <LinkIcon className="w-6 h-6 text-blue-500" />,
        'video': <VideoIcon className="w-6 h-6 text-purple-500" />,
        'image': <ImageIcon className="w-6 h-6 text-green-500" />,
        'audio': <AudioFileIcon className="w-6 h-6 text-orange-500" />,
        'document': <DocumentIcon className="w-6 h-6 text-blue-700" />,
        'spreadsheet': <SpreadsheetIcon className="w-6 h-6 text-green-700" />,
    };
    return <>{icons[type]}</>;
}


export default function Library() {
    const { resources, deleteResource, currentUser, students } = useDataContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
    const [filterCategory, setFilterCategory] = useState<ResourceCategory | 'all'>('all');

    const filteredResources = useMemo(() => {
        return resources.filter(r => {
            const isMyResource = r.uploaderId === currentUser?.id;
            const isPublic = r.isPublic;
            const isAssignedToMe = r.assignedTo?.includes(currentUser?.id || '');
            const canView = isMyResource || isPublic || isAssignedToMe;
            const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
            return canView && matchesCategory;
        });
    }, [resources, currentUser, filterCategory]);

    const categorizedResources = useMemo(() => {
        const grouped: Record<string, Resource[]> = {};
        filteredResources.forEach(r => {
            const categoryLabel = ResourceCategoryLabels[r.category] || 'Diğer';
            if (!grouped[categoryLabel]) {
                grouped[categoryLabel] = [];
            }
            grouped[categoryLabel].push(r);
        });
        return grouped;
    }, [filteredResources]);
    
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2"><LibraryIcon className="w-8 h-8"/> Kütüphane</h1>
                     <div className="flex items-center gap-4">
                        <select value={filterCategory} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value as any)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                             <option value="all">Tüm Kategoriler</option>
                            {Object.entries(ResourceCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold">
                            + Yeni Kaynak
                        </button>
                    </div>
                </div>
            </Card>

            {filteredResources.length > 0 ? (
                Object.entries(categorizedResources).map(([category, resourcesInCategory]) => (
                    <div key={category}>
                        <h2 className="text-xl font-bold mb-2">{category}</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resourcesInCategory.map(resource => (
                                <Card key={resource.id} className="p-4 flex flex-col justify-between">
                                    <div className="flex items-start gap-3">
                                        <ResourceIcon type={resource.type} />
                                        <div className="flex-1">
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{resource.name}</a>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {!resource.isPublic ? `Özel (${resource.assignedTo?.map(id => students.find(s=>s.id === id)?.name.split(' ')[0]).join(', ') || '0 Öğrenci'})` : 'Herkese Açık'}
                                            </div>
                                        </div>
                                    </div>
                                    {resource.uploaderId === currentUser?.id && (
                                        <div className="self-end mt-2">
                                            <button onClick={() => setResourceToDelete(resource)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                 <EmptyState 
                    icon={<LibraryIcon className="w-12 h-12"/>}
                    title="Kütüphane Boş"
                    description="Öğrencilerinizle paylaşmak için yeni kaynaklar ekleyin."
                    action={{ label: "Yeni Kaynak Ekle", onClick: () => setIsModalOpen(true) }}
                />
            )}

            {isModalOpen && <AddResourceModal onClose={() => setIsModalOpen(false)} />}
            {resourceToDelete && (
                <ConfirmationModal 
                    isOpen={!!resourceToDelete} 
                    onClose={() => setResourceToDelete(null)} 
                    onConfirm={() => { if(resourceToDelete) deleteResource(resourceToDelete.id); setResourceToDelete(null); }}
                    title="Kaynağı Sil"
                    message={`'${resourceToDelete.name}' adlı kaynağı kalıcı olarak silmek istediğinizden emin misiniz?`}
                />
            )}
        </div>
    );
}
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useDataContext } from '../contexts/DataContext';
import { Resource, UserRole, AcademicTrack } from '../types';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { DocumentIcon, LibraryIcon, LinkIcon, TrashIcon, VideoIcon, ImageIcon, AudioFileIcon, SpreadsheetIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import VideoRecorder from '../components/VideoRecorder';

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
    const [isPublic, setIsPublic] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [filterGrade, setFilterGrade] = useState('all');

    const availableStudents = useMemo(() => {
        if (filterGrade === 'all') return students;
        return students.filter(s => s.gradeLevel === filterGrade);
    }, [students, filterGrade]);


    const handleTypeChange = (newType: Resource['type']) => {
        setType(newType);
        setUrl('');
        setFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name && !file) {
            addToast("Lütfen bir kaynak adı girin.", "error");
            return;
        }
        if ((type === 'link' && !url) || (type !== 'link' && !file && type !== 'video') || (type === 'video' && !url)) {
            addToast("Lütfen bir URL girin veya bir dosya seçin.", "error");
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

            if (type !== 'link' && type !== 'video' && file) {
                if (!resourceName) {
                    resourceName = file.name;
                }
                resourceUrl = await uploadFile(file, `library/${currentUser.id}/${file.name}`);
            }

            await addResource({ name: resourceName, url: resourceUrl, type, isPublic, assignedTo: isPublic ? [] : assignedTo });
            addToast("Kaynak başarıyla eklendi.", "success");
            onClose();
        } catch (error) {
            console.error("Error adding resource:", error);
            addToast("Kaynak eklenirken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    const mimeTypes: {[key in Resource['type']]?: string} = {
        pdf: '.pdf',
        video: 'video/*',
        image: 'image/*',
        audio: 'audio/*',
        document: '.doc,.docx,.txt,.rtf,.odt',
        spreadsheet: '.xls,.xlsx,.csv',
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Kaynak Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Kaynak Adı</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={file ? file.name : "Örn: Türev Konu Anlatımı"} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Kaynak Türü</label>
                    <select value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTypeChange(e.target.value as Resource['type'])} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="link">Bağlantı</option>
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="image">Görsel</option>
                        <option value="audio">Ses Dosyası</option>
                        <option value="document">Doküman</option>
                        <option value="spreadsheet">Hesap Tablosu</option>
                    </select>
                </div>

                {type === 'link' ? (
                    <div>
                        <label className="block text-sm font-medium mb-1">URL (Bağlantı)</label>
                        <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                ) : type === 'video' ? (
                    <div>
                         <label className="block text-sm font-medium mb-1">Video</label>
                         <VideoRecorder onSave={(videoUrl) => setUrl(videoUrl || '')}/>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium mb-1">Dosya</label>
                        <div className="mt-1">
                            <label htmlFor="resource-file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none border dark:border-gray-600 p-3 text-center block transition-colors hover:border-primary-500">
                                <div className="flex items-center justify-center gap-2">
                                    <DocumentIcon className="w-5 h-5"/>
                                    <span>{file ? file.name : 'Bir dosya seçin veya sürükleyin'}</span>
                                </div>
                                <input 
                                    id="resource-file-upload" 
                                    name="resource-file-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)} 
                                    accept={mimeTypes[type]}
                                    required
                                />
                            </label>
                        </div>
                    </div>
                )}
               
                <div className="flex items-center pt-2">
                    <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <label htmlFor="isPublic" className="ml-2 text-sm">Herkese Açık</label>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                    İşaretli ise, bu kaynak tüm öğrenciler tarafından görülebilir. İşaretli değilse, sadece sizin atadığınız öğrenciler görebilir.
                </p>

                {!isPublic && (
                     <div className="space-y-2">
                        <div>
                            <label className="block text-sm font-medium mb-1">Sınıf Filtresi</label>
                            <select
                                value={filterGrade}
                                // FIX: Add explicit type to event handler parameter `e`.
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    setFilterGrade(e.target.value);
                                    setAssignedTo([]);
                                }}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="all">Tüm Sınıflar</option>
                                <option value="9">9. Sınıf</option>
                                <option value="10">10. Sınıf</option>
                                <option value="11">11. Sınıf</option>
                                <option value="12">12. Sınıf</option>
                                <option value="mezun">Mezun</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Öğrencileri Ata</label>
                            <select multiple value={assignedTo} onChange={e => setAssignedTo(Array.from(e.target.selectedOptions, option => option.value))} className="w-full p-2 border rounded-md h-32 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                             <p className="text-xs text-gray-500 mt-1">Birden çok öğrenci seçmek için Ctrl (veya Mac'te Cmd) tuşunu basılı tutun.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isLoading}>İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                        {isLoading ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const AssignResourceModal = ({ resource, onClose }: { resource: Resource; onClose: () => void }) => {
    const { students, toggleResourceAssignment } = useDataContext();
    const [filterGrade, setFilterGrade] = useState('all');
    const [filterTrack, setFilterTrack] = useState<AcademicTrack | 'all'>('all');

    const academicTrackLabels: Record<AcademicTrack, string> = {
        [AcademicTrack.Sayisal]: 'Sayısal',
        [AcademicTrack.EsitAgirlik]: 'Eşit Ağırlık',
        [AcademicTrack.Sozel]: 'Sözel',
        [AcademicTrack.Dil]: 'Dil',
    };

    const availableStudents = useMemo(() => {
        return students.filter(s => 
            (filterGrade === 'all' || s.gradeLevel === filterGrade) &&
            (filterTrack === 'all' || s.academicTrack === filterTrack)
        );
    }, [students, filterGrade, filterTrack]);

    return (
        <Modal isOpen={true} onClose={onClose} title={`"${resource.name}" Kaynağını Ata`}>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select
                    value={filterGrade}
                    onChange={e => setFilterGrade(e.target.value)}
                    className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="all">Tüm Sınıflar</option>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf</option>
                    <option value="mezun">Mezun</option>
                </select>
                 <select
                    value={filterTrack}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterTrack(e.target.value as AcademicTrack | 'all')}
                    className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="all">Tüm Bölümler</option>
                    {Object.entries(academicTrackLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>
            <div className="max-h-80 overflow-y-auto">
                <p className="text-sm text-gray-500 mb-4">Bu özel kaynağı atamak istediğiniz öğrenciler seçin.</p>
                <ul className="space-y-2">
                    {availableStudents.map(student => {
                        const isAssigned = resource.assignedTo?.includes(student.id);
                        return (
                            <li key={student.id}>
                                <label className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAssigned}
                                        onChange={() => toggleResourceAssignment(resource.id, student.id)}
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
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kapat</button>
            </div>
        </Modal>
    );
};

interface ResourceCardProps {
    resource: Resource;
    isCoachOrAdmin: boolean;
    onAssign: (res: Resource) => void;
    onDelete: (res: Resource) => void;
    [key: string]: any;
}

const ResourceCard = ({ resource, isCoachOrAdmin, onAssign, onDelete, ...props }: ResourceCardProps) => {
    const typeIcons = {
        pdf: <DocumentIcon className="w-8 h-8 text-red-500" />,
        link: <LinkIcon className="w-8 h-8 text-blue-500" />,
        video: <VideoIcon className="w-8 h-8 text-purple-500" />,
        image: <ImageIcon className="w-8 h-8 text-teal-500" />,
        audio: <AudioFileIcon className="w-8 h-8 text-orange-500" />,
        document: <DocumentIcon className="w-8 h-8 text-gray-500" />,
        spreadsheet: <SpreadsheetIcon className="w-8 h-8 text-green-500" />,
    };
    
    return (
        <Card {...props}>
            <div className="flex flex-col h-full">
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 group flex-grow">
                    <div className="flex-shrink-0">{typeIcons[resource.type]}</div>
                    <div>
                        <h4 className="font-semibold group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">{resource.name}</h4>
                        <p className="text-xs text-gray-500 uppercase">{resource.type}</p>
                    </div>
                </a>
                {isCoachOrAdmin && (
                    <div className="mt-4 pt-3 border-t dark:border-gray-700 flex justify-end items-center gap-2">
                       {!resource.isPublic && (
                            <button onClick={() => onAssign(resource)} className="text-sm font-semibold text-primary-600 hover:underline">
                                Ata ({resource.assignedTo?.length || 0})
                            </button>
                       )}
                       <button onClick={() => onDelete(resource)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Kaynağı Sil">
                            <TrashIcon className="w-4 h-4" />
                       </button>
                    </div>
                )}
            </div>
        </Card>
    )
};

export default function Library() {
    const { resources, currentUser, students, deleteResource } = useDataContext();
    const { addToast } = useUI();
    const [activeTab, setActiveTab] = useState(currentUser?.role === UserRole.Student ? 'public' : 'public');
    const [showAddModal, setShowAddModal] = useState(false);
    const [resourceToAssign, setResourceToAssign] = useState<Resource | null>(null);
    const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | Resource['type']>('all');
    const [filterStudent, setFilterStudent] = useState('all');
    
    const isCoachOrAdmin = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;

    const myPrivateResources = useMemo(() => 
        resources.filter(r => !r.isPublic && r.assignedTo?.includes(currentUser?.id || '')),
    [resources, currentUser]);

    const displayedResources = useMemo(() => {
        let initialList: Resource[] = [];

        if (activeTab === 'public') {
            initialList = resources.filter(r => r.isPublic);
        } else if (activeTab === 'private' && isCoachOrAdmin) {
            initialList = resources.filter(r => !r.isPublic);
        } else if (activeTab === 'my-private' && currentUser?.role === UserRole.Student) {
            initialList = myPrivateResources;
        }

        return initialList.filter(resource => {
            const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || resource.type === filterType;
            const matchesStudent = (activeTab !== 'private' || !isCoachOrAdmin || filterStudent === 'all') || resource.assignedTo?.includes(filterStudent);
            
            return matchesSearch && matchesType && matchesStudent;
        });

    }, [resources, activeTab, isCoachOrAdmin, currentUser, myPrivateResources, searchTerm, filterType, filterStudent]);
    
    const handleDelete = () => {
        if (resourceToDelete) {
            deleteResource(resourceToDelete.id);
            addToast("Kaynak başarıyla silindi.", "success");
            setResourceToDelete(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="border-b border-gray-200 dark:border-gray-700 w-full md:w-auto">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('public')} className={`${activeTab === 'public' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Genel Kütüphane
                            </button>
                            {isCoachOrAdmin && (
                                 <button onClick={() => setActiveTab('private')} className={`${activeTab === 'private' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                    Öğrenciye Özel Kaynaklar
                                </button>
                            )}
                            {currentUser?.role === UserRole.Student && (
                                <button onClick={() => setActiveTab('my-private')} className={`${activeTab === 'my-private' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}>
                                    Bana Özel
                                    {myPrivateResources.length > 0 && <span className="absolute top-2 -right-3 ml-2 bg-primary-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{myPrivateResources.length}</span>}
                                </button>
                            )}
                        </nav>
                    </div>
                     {isCoachOrAdmin && (
                        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold w-full md:w-auto flex-shrink-0">
                            + Yeni Kaynak Ekle
                        </button>
                    )}
                </div>
                 <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <input type="text" placeholder="Kaynak adı ile ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 flex-grow" />
                    <select value={filterType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as 'all' | Resource['type'])} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="all">Tüm Türler</option>
                        <option value="link">Bağlantı</option>
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="image">Görsel</option>
                        <option value="audio">Ses Dosyası</option>
                        <option value="document">Doküman</option>
                        <option value="spreadsheet">Hesap Tablosu</option>
                    </select>
                    {isCoachOrAdmin && activeTab === 'private' && (
                        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <option value="all">Tüm Öğrenciler</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                </div>
            </Card>

            {displayedResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedResources.map((resource) => (
                        <ResourceCard 
                            key={resource.id} 
                            resource={resource} 
                            isCoachOrAdmin={isCoachOrAdmin}
                            onAssign={setResourceToAssign}
                            onDelete={setResourceToDelete}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<LibraryIcon className="w-10 h-10" />}
                    title="Kaynak Bulunamadı"
                    description={searchTerm || filterType !== 'all' || filterStudent !== 'all' ? "Arama kriterlerinize uygun kaynak bulunamadı." : "Bu bölümde henüz bir kaynak bulunmuyor."}
                />
            )}
            
            {showAddModal && <AddResourceModal onClose={() => setShowAddModal(false)} />}
            {resourceToAssign && <AssignResourceModal resource={resourceToAssign} onClose={() => setResourceToAssign(null)} />}
            {resourceToDelete && (
                <ConfirmationModal 
                    isOpen={!!resourceToDelete}
                    onClose={() => setResourceToDelete(null)}
                    onConfirm={handleDelete}
                    title="Kaynağı Sil"
                    message={`'${resourceToDelete.name}' adlı kaynağı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                />
            )}
        </div>
    );
};
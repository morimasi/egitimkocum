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

const getAcademicTrackLabel = (track: AcademicTrack): string => {
    switch (track) {
        case AcademicTrack.Sayisal: return 'Sayısal';
        case AcademicTrack.EsitAgirlik: return 'Eşit Ağırlık';
        case AcademicTrack.Sozel: return 'Sözel';
        case AcademicTrack.Dil: return 'Dil';
        default: return '';
    }
};

const ResourceCategoryLabels: Record<ResourceCategory, string> = {
    [ResourceCategory.Matematik]: 'Matematik',
    [ResourceCategory.Fizik]: 'Fizik',
    [ResourceCategory.Kimya]: 'Kimya',
    [ResourceCategory.Biyoloji]: 'Biyoloji',
    [ResourceCategory.Turkce]: 'Türkçe',
    [ResourceCategory.Tarih]: 'Tarih',
    [ResourceCategory.Cografya]: 'Coğrafya',
    [ResourceCategory.Felsefe]: 'Felsefe',
    [ResourceCategory.Ingilizce]: 'İngilizce',
    [ResourceCategory.Genel]: 'Genel Kaynaklar',
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
                resourceUrl = await uploadFile(file, `library/${currentUser.id}/${file.name}`);
            }

            await addResource({ name: resourceName, url: resourceUrl, type, isPublic, assignedTo: isPublic ? [] : assignedTo, category });
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
                        <label className="block text-sm font-medium mb-2">{type === 'video' ?
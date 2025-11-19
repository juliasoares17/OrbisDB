import './styleSearchBar.css'
import React from 'react';

// Define a interface para as propriedades (props) que o componente receberá
interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    placeholder?: string; // Prop opcional para customizar o texto
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
    searchQuery, 
    onSearchChange, 
    placeholder = "Pesquisar por nome..." 
}) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Quando o valor do campo muda, chama a função passada pela página-mãe
        onSearchChange(e.target.value);
    };

    return (
        <div className="mb-6">
            <input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
        </div>
    );
};
'use client'

import React, { useState, useEffect, ChangeEvent } from 'react';
import { PDFDocument, PDFForm, PDFField, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';

interface DateTimeDropdownProps {
  name: string;
}

const DateTimeDropdown: React.FC<DateTimeDropdownProps> = ({ name }) => (
  <input type="datetime-local" name={name} className="w-full border px-2 py-1" />
);

interface FormField {
  name: string;
  type: 'text' | 'select' | 'checkbox' | 'date' | 'number' | 'datetime';
  options?: string[];
  validationRules: {
    maxLength?: number;
    min?: number;
  };
}

interface FormData {
  [key: string]: string | boolean | number;
}

const usStatesAndTerritories = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'AS', name: 'American Samoa' },
  { code: 'GU', name: 'Guam' },
  { code: 'MP', name: 'Northern Mariana Islands' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'VI', name: 'U.S. Virgin Islands' },
];

const BillOfLadingForm: React.FC = () => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pickupZip, setPickupZip] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('');

  useEffect(() => {
    analyzePdfTemplate();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleZipChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setter(value);
  };

  const analyzePdfTemplate = async () => {
    try {
      const templateUrl = '/Sample-Fillable-PDF.pdf';
      const response = await fetch(templateUrl);
      const templateBytes = await response.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
      setPdfDoc(pdfDoc);

      const form = pdfDoc.getForm();
      const fields = form.getFields();

      const extractedFields: FormField[] = fields.map(field => {
        const name = field.getName();
        let type: FormField['type'] = 'text';
        let options: string[] | undefined;
        const validationRules: FormField['validationRules'] = {};

        if (field instanceof PDFDropdown) {
          type = 'select';
          options = field.getOptions();
        } else if (field instanceof PDFCheckBox) {
          type = 'checkbox';
        } else if (field instanceof PDFTextField) {
          const maxLength = field.getMaxLength();
          if (maxLength) {
            validationRules.maxLength = maxLength;
          }
          if (name.toLowerCase().includes('date')) {
            type = 'date';
          } else if (name.toLowerCase().includes('amount') || name.toLowerCase().includes('value')) {
            type = 'number';
            validationRules.min = 0;
          }
        }

        return { name, type, options, validationRules };
      });

      setFormFields(extractedFields);
      const initialFormData = extractedFields.reduce((acc, field) => {
        acc[field.name] = field.type === 'checkbox' ? false : '';
        return acc;
      }, {} as FormData);
      setFormData(initialFormData);

      console.log('Extracted fields:', extractedFields);
    } catch (error) {
      console.error('Error analyzing PDF template:', error);
      alert('An error occurred while analyzing the PDF template. Please check the console for more details.');
    }
  };

  const fillPdfTemplate = async () => {
    if (!pdfDoc) return;

    try {
      const form = pdfDoc.getForm();

      Object.entries(formData).forEach(([key, value]) => {
        const field = form.getField(key);
        
        if (field instanceof PDFTextField) {
          field.setText(value as string);
        } else if (field instanceof PDFCheckBox) {
          if (value === true) {
            field.check();
          } else {
            field.uncheck();
          }
        } else if (field instanceof PDFDropdown) {
          field.select(value as string);
        } else {
          console.warn(`Unsupported field type for field: ${key}`);
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'filled_form.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error filling PDF template:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    }
  };

  const renderField = (field: FormField) => {
    const { name, type, options, validationRules } = field;

    let inputProps = {
      id: name,
      name: name,
      value: formData[name] as string | number,
      onChange: handleInputChange,
      required: true,
      ...validationRules
    };

    switch (type) {
      case 'select':
        return (
          <div key={name} className="space-y-2">
            <label htmlFor={name}>{name}</label>
            <select {...inputProps} className="w-full border px-2 py-1">
              <option value="">Select an option</option>
              {options && options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      case 'checkbox':
        return (
          <div key={name} className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...inputProps}
                checked={formData[name] as boolean}
                onChange={(e) => handleInputChange(e as ChangeEvent<HTMLInputElement>)}
              />
              <span className="ml-2">{name}</span>
            </label>
          </div>
        );
      case 'date':
        return (
          <div key={name} className="space-y-2">
            <label htmlFor={name}>{name}</label>
            <input type="date" {...inputProps} className="w-full border px-2 py-1" />
          </div>
        );
      case 'number':
        return (
          <div key={name} className="space-y-2">
            <label htmlFor={name}>{name}</label>
            <input type="number" {...inputProps} className="w-full border px-2 py-1" />
          </div>
        );
      case 'datetime':
        return <DateTimeDropdown key={name} name={name} />;
      default:
        return (
          <div key={name} className="space-y-2">
            <label htmlFor={name}>{name}</label>
            <input type="text" {...inputProps} className="w-full border px-2 py-1" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg">
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">AB Trucking</h1>
          <p>10 Burma Rd, Oakland, CA 94607</p>
          <p>Phone: 510-835-0930</p>
          <p>Email: dispatch@abtruck.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold">Straight Bill of Lading</h2>
          <p>Container #: <input type="text" className="border px-2" /></p>
          <p>BOL #: <input type="text" className="border px-2" /></p>
          <p>Customer Ref #: <input type="text" className="border px-2" /></p>
          <p>Carrier Ref #: <input type="text" className="border px-2" /></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border p-2">
          <h3 className="font-semibold">Pick Up from</h3>
          <input type="text" className="w-full border px-2 mb-2" placeholder="Name" />
          <input type="text" className="w-full border px-2 mb-2" placeholder="Address" />
          <input type="text" className="w-full border px-2 mb-2" placeholder="City" />
          <select className="w-full border px-2 mb-2">
            <option value="">Select State</option>
            {usStatesAndTerritories.map(state => (
              <option key={state.code} value={state.code}>{state.name}</option>
            ))}
          </select>
          <input 
            type="text" 
            className="w-full border px-2" 
            placeholder="ZIP" 
            value={pickupZip}
            onChange={handleZipChange(setPickupZip)}
          />
        </div>
        <div className="border p-2">
          <h3 className="font-semibold">Delivery To</h3>
          <input type="text" className="w-full border px-2 mb-2" placeholder="Name" />
          <input type="text" className="w-full border px-2 mb-2" placeholder="Address" />
          <input type="text" className="w-full border px-2 mb-2" placeholder="City" />
          <select className="w-full border px-2 mb-2">
            <option value="">Select State</option>
            {usStatesAndTerritories.map(state => (
              <option key={state.code} value={state.code}>{state.name}</option>
            ))}
          </select>
          <input 
            type="text" 
            className="w-full border px-2" 
            placeholder="ZIP" 
            value={deliveryZip}
            onChange={handleZipChange(setDeliveryZip)}
          />
        </div>
      </div>

      <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
        Submit BOL
      </button>
    </div>
  );
};

export default BillOfLadingForm;

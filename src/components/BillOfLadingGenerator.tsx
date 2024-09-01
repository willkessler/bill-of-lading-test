'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PDFDocument, PDFField, PDFForm, PDFOptionList, PDFCheckBox, PDFTextField, PDFDropdown } from 'pdf-lib';

interface FormField {
  name: string;
  type: 'text' | 'date' | 'number';
  validationRules: {
    maxLength?: number;
    min?: number;
  };
}

const BillOfLadingGenerator: React.FC = () => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);

  useEffect(() => {
    analyzePdfTemplate();
  }, []);

  const analyzePdfTemplate = async () => {
    try {
      const templateUrl = '/Sample-Fillable-PDF.pdf';
      const response = await fetch(templateUrl);
      const templateBytes = await response.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
      setPdfDoc(pdfDoc);

      const form = pdfDoc.getForm();
      const fields = form.getFields();

      const extractedFields = fields.map(field => {
        const name = field.getName();
        let type = 'text';
        let options = [];

        if (field instanceof PDFOptionList) {
          type = 'select';
          options = field.getOptions();
        } else if (field instanceof PDFCheckBox) {
          type = 'checkbox';
        } else if (field instanceof PDFTextField) {
          const maxLength = field.getMaxLength();
          if (maxLength) {
            validationRules.maxLength = maxLength;
          }
          // Infer field type based on field name
          if (name.toLowerCase().includes('date')) {
            type = 'date';
          } else if (name.toLowerCase().includes('amount') || name.toLowerCase().includes('value')) {
            type = 'number';
            validationRules.min = 0;
          }
        }

        return { name, type, options, validationRules: {} };
      });

      setFormFields(extractedFields);
      const initialFormData = extractedFields.reduce((acc, field) => {
        acc[field.name] = field.type === 'checkbox' ? false : '';
        return acc;
      }, {});
      setFormData(initialFormData);

      console.log('Extracted fields:', extractedFields);
    } catch (error) {
      console.error('Error analyzing PDF template:', error);
      alert('An error occurred while analyzing the PDF template. Please check the console for more details.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  const renderField = (field) => {
    const { name, type, options, validationRules } = field;

    let inputProps = {
      id: name,
      name: name,
      value: formData[name],
      onChange: handleInputChange,
      required: true,
      ...validationRules
    };

    switch (type) {
      case 'select':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{name}</Label>
            <select {...inputProps} className="w-full border px-2 py-1">
              <option value="">Select an option</option>
              {options.map((option, index) => (
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
                checked={formData[name]}
                onChange={(e) => handleInputChange({ target: { name, value: e.target.checked } })}
              />
              <span className="ml-2">{name}</span>
            </label>
          </div>
        );
      case 'date':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{name}</Label>
            <input type="date" {...inputProps} className="w-full border px-2 py-1" />
          </div>
        );
      case 'number':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{name}</Label>
            <input type="number" {...inputProps} className="w-full border px-2 py-1" />
          </div>
        );
      default:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{name}</Label>
            <Input {...inputProps} />
          </div>
        );
    }
  };
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>BOL created on the fly by loading a PDF</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            {formFields.map(renderField)}
          </div>
          <Button onClick={fillPdfTemplate} className="w-full">
            Generate and Download Filled PDF
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BillOfLadingGenerator;

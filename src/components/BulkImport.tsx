import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface BulkImportProps {
  type: "products" | "customers";
  onComplete: () => void;
}

export const BulkImport = ({ type, onComplete }: BulkImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors([]);
      setSuccessCount(0);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      products: [
        ["name", "sku", "barcode", "category", "price", "cost_price", "quantity_in_stock", "reorder_level", "unit", "gst_applicability", "default_gst_rate", "description"],
        ["Product 1", "SKU001", "1234567890", "Category A", "100", "80", "50", "10", "pcs", "GST", "18", "Sample product"]
      ],
      customers: [
        ["name", "phone", "email", "gstin", "address"],
        ["John Doe", "9876543210", "john@example.com", "29XXXXX1234X1Z5", "123 Main St, City"]
      ]
    };

    const csv = Papa.unparse(templates[type]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateProductRow = (row: any): string | null => {
    if (!row.name || !row.sku) {
      return "Name and SKU are required";
    }
    if (row.price && isNaN(parseFloat(row.price))) {
      return "Invalid price";
    }
    if (row.gst_applicability && !["GST", "NON-GST"].includes(row.gst_applicability)) {
      return "GST applicability must be GST or NON-GST";
    }
    return null;
  };

  const validateCustomerRow = (row: any): string | null => {
    if (!row.name) {
      return "Name is required";
    }
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      return "Invalid email format";
    }
    return null;
  };

  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      if (fileExt === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error)
        });
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format'));
      }
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    setProgress(0);
    setErrors([]);
    setSuccessCount(0);

    try {
      const data = await parseFile(file);
      const totalRows = data.length;
      let imported = 0;
      const errorList: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2; // +2 because of header and 0-index

        // Validate
        const validationError = type === "products" 
          ? validateProductRow(row) 
          : validateCustomerRow(row);

        if (validationError) {
          errorList.push(`Row ${rowNum}: ${validationError}`);
          continue;
        }

        try {
          if (type === "products") {
            const productData = {
              name: row.name,
              sku: row.sku,
              barcode: row.barcode || null,
              category: row.category || null,
              price: parseFloat(row.price) || 0,
              cost_price: parseFloat(row.cost_price) || 0,
              quantity_in_stock: parseFloat(row.quantity_in_stock) || 0,
              reorder_level: parseFloat(row.reorder_level) || 0,
              unit: row.unit || 'pcs',
              gst_applicability: row.gst_applicability || 'GST',
              default_gst_rate: parseFloat(row.default_gst_rate) || 0,
              description: row.description || null,
            };

            const { error } = await supabase.from("products").insert([productData]);
            if (error) throw error;
          } else {
            const customerData = {
              name: row.name,
              phone: row.phone || null,
              email: row.email || null,
              gstin: row.gstin || null,
              address: row.address || null,
            };

            const { error } = await supabase.from("customers").insert([customerData]);
            if (error) throw error;
          }

          imported++;
        } catch (error: any) {
          errorList.push(`Row ${rowNum}: ${error.message}`);
        }

        setProgress(((i + 1) / totalRows) * 100);
      }

      setSuccessCount(imported);
      setErrors(errorList);

      if (imported > 0) {
        toast.success(`Successfully imported ${imported} ${type}`);
        onComplete();
      }

      if (errorList.length > 0) {
        toast.warning(`${errorList.length} rows had errors`);
      }
    } catch (error: any) {
      toast.error("Failed to parse file: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import {type === "products" ? "Products" : "Customers"}</CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to import multiple records at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Download Template</Label>
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download {type === "products" ? "Products" : "Customers"} Template
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Upload File (CSV or Excel)</Label>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={importing}
          />
        </div>

        {file && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </AlertDescription>
          </Alert>
        )}

        {importing && (
          <div className="space-y-2">
            <Label>Import Progress</Label>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{progress.toFixed(0)}%</p>
          </div>
        )}

        {successCount > 0 && (
          <Alert className="border-accent bg-accent/10">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <AlertDescription>
              Successfully imported {successCount} records
            </AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Import Errors:</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {errors.slice(0, 10).map((error, idx) => (
                  <div key={idx} className="text-sm">{error}</div>
                ))}
                {errors.length > 10 && (
                  <div className="text-sm font-semibold">
                    ...and {errors.length - 10} more errors
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleImport} 
          disabled={!file || importing}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {importing ? "Importing..." : "Import Data"}
        </Button>
      </CardContent>
    </Card>
  );
};

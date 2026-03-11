import { MaterialsLayout } from "@/components/employee/materials/MaterialsLayout";

export default function EmployeeMaterialsPage() {
    return (
        <div className="animate-in fade-in duration-500 w-full h-full -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="h-[calc(100vh-140px)] min-h-[700px] w-full">
                <MaterialsLayout />
            </div>
        </div>
    );
}

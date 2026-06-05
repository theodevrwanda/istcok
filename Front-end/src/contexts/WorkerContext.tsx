import React, { createContext, useContext, useState, useEffect } from "react";
import { workers as initialWorkers, Worker } from "@/data/mockData";

interface WorkerContextType {
  workers: Worker[];
  addWorker: (worker: Worker) => void;
  updateWorker: (worker: Worker) => void;
  deleteWorker: (id: number) => void;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const WorkerProvider = ({ children }: { children: React.ReactNode }) => {
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem("oluxy_workers");
    return saved ? JSON.parse(saved) : initialWorkers;
  });

  useEffect(() => {
    localStorage.setItem("oluxy_workers", JSON.stringify(workers));
  }, [workers]);

  const addWorker = (worker: Worker) => {
    setOrders((prev) => [worker, ...prev]);
  };
  // Wait, I used setOrders instead of setWorkers in my thought. Correcting below.

  const addWorkerActual = (worker: Worker) => {
    setWorkers((prev) => [worker, ...prev]);
  };

  const updateWorker = (worker: Worker) => {
    setWorkers((prev) => prev.map((w) => (w.id === worker.id ? worker : w)));
  };

  const deleteWorker = (id: number) => {
    setWorkers((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <WorkerContext.Provider value={{ workers, addWorker: addWorkerActual, updateWorker, deleteWorker }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorkers = () => {
  const context = useContext(WorkerContext);
  if (!context) throw new Error("useWorkers must be used within WorkerProvider");
  return context;
};

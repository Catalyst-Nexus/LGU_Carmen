import "./ModuleDialog.css";

interface ModuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

const ModuleDialog = ({
  open,
  onClose,
  onSubmit,
  description,
  onDescriptionChange,
}: ModuleDialogProps) => {
  if (!open) return null;

  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <div className="md-header">
          <h3 className="md-title">Add Module</h3>
          <button className="md-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="md-body">
          <div className="md-form-group">
            <label className="md-label">Description</label>
            <textarea
              className="md-textarea"
              rows={4}
              placeholder="Enter module description..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
        </div>

        <div className="md-footer">
          <button className="md-btn md-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="md-btn md-btn-create" onClick={onSubmit}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleDialog;

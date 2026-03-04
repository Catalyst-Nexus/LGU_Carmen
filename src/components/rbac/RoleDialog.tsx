import "./RoleDialog.css";

interface RoleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

const RoleDialog = ({
  open,
  onClose,
  onSubmit,
  description,
  onDescriptionChange,
}: RoleDialogProps) => {
  if (!open) return null;

  return (
    <div className="rd-overlay" onClick={onClose}>
      <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rd-header">
          <h3 className="rd-title">Create Role</h3>
          <button className="rd-close-btn" onClick={onClose}>
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

        <div className="rd-body">
          <div className="rd-form-group">
            <label className="rd-label">Description</label>
            <textarea
              className="rd-textarea"
              rows={4}
              placeholder="Enter role description..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
        </div>

        <div className="rd-footer">
          <button className="rd-btn rd-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="rd-btn rd-btn-create" onClick={onSubmit}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleDialog;

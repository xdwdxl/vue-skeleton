export interface CheckboxOption {
    label: string
    value: string | number | boolean
    disabled?: boolean
    checked?: boolean
    indeterminate?: boolean
    border?: boolean
    size?: 'large' | 'default' | 'small'
    trueValue?: string | number
    falseValue?: string | number
}

export interface TreeNode {
    label: string
    children?: TreeNode[]
    [key: string]: any
}

export interface SelectOption {
    value: string
    label: string
}

export interface RadioOption {
    label: string
    value: string | number
    disabled?: boolean
}

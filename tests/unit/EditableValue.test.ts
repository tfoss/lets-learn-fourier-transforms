import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EditableValue from '../../src/components/EditableValue.vue'

describe('EditableValue', () => {
  const defaultProps = {
    displayValue: '440 Hz',
    modelValue: 440,
    min: 20,
    max: 4000,
  }

  it('renders the display value as text', () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    expect(wrapper.text()).toBe('440 Hz')
  })

  it('does not show input by default', () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('shows input when clicked', async () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    await wrapper.find('[data-testid="editable-value"]').trigger('click')
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('input has the current model value', async () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    await wrapper.find('[data-testid="editable-value"]').trigger('click')
    const input = wrapper.find('input')
    expect(input.element.value).toBe('440')
  })

  it('emits update on Enter', async () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    await wrapper.find('[data-testid="editable-value"]').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('880')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([880])
  })

  it('cancels on Escape without emitting', async () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    await wrapper.find('[data-testid="editable-value"]').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('880')
    await input.trigger('keydown.escape')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('clamps value to max on confirm', async () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    await wrapper.find('[data-testid="editable-value"]').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('9999')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([4000])
  })

  it('clamps value to min on confirm', async () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    await wrapper.find('[data-testid="editable-value"]').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('5')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([20])
  })

  it('uses custom testId', () => {
    const wrapper = mount(EditableValue, {
      props: { ...defaultProps, testId: 'freq-edit' },
    })
    expect(wrapper.find('[data-testid="freq-edit"]').exists()).toBe(true)
  })

  it('confirms on blur', async () => {
    const wrapper = mount(EditableValue, { props: defaultProps })
    await wrapper.find('[data-testid="editable-value"]').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('660')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([660])
  })
})
